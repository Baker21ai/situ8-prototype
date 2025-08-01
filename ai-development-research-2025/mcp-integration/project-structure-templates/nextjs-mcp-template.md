# Next.js MCP Integration Template

*Complete MCP setup for Next.js applications with database and API integration*

## 🏗️ Project Structure

```
nextjs-mcp-project/
├── .mcp.json                           # MCP configuration
├── mcp-servers/                        # Custom MCP servers
│   ├── database-server.py             # Database operations
│   ├── api-server.py                  # API integrations
│   ├── file-manager.py                # File operations
│   └── deployment-server.py           # Deployment tools
├── scripts/
│   ├── setup-mcp.sh                   # MCP setup script
│   └── start-dev.sh                   # Development startup
├── src/
│   ├── app/                           # Next.js app directory
│   ├── components/                    # React components
│   ├── lib/                          # Utilities
│   └── types/                        # TypeScript types
├── prisma/                           # Database schema
│   ├── schema.prisma
│   └── migrations/
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── .env.mcp                         # MCP-specific environment
├── CLAUDE.md                        # Claude context file
├── package.json
└── README.md
```

## 🔧 MCP Configuration

### .mcp.json
```json
{
  "mcpServers": {
    "database": {
      "command": "python",
      "args": ["./mcp-servers/database-server.py"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "PRISMA_SCHEMA_PATH": "./prisma/schema.prisma"
      }
    },
    "api-client": {
      "command": "python",
      "args": ["./mcp-servers/api-server.py"],
      "env": {
        "NEXT_PUBLIC_API_URL": "${NEXT_PUBLIC_API_URL}",
        "API_SECRET": "${API_SECRET}"
      }
    },
    "file-manager": {
      "command": "python",
      "args": ["./mcp-servers/file-manager.py"],
      "env": {
        "UPLOAD_DIR": "./public/uploads",
        "MAX_FILE_SIZE": "10485760"
      }
    },
    "deployment": {
      "command": "python",
      "args": ["./mcp-servers/deployment-server.py"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}",
        "PROJECT_ID": "${VERCEL_PROJECT_ID}"
      }
    }
  }
}
```

### Environment Configuration

#### .env.local
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_db"
DIRECT_URL="postgresql://user:password@localhost:5432/nextjs_db"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
API_SECRET="your-api-secret-here"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# External Services
VERCEL_TOKEN="your-vercel-token"
VERCEL_PROJECT_ID="your-project-id"

# File Upload
MAX_FILE_SIZE="10485760"
UPLOAD_DIR="./public/uploads"
```

#### .env.mcp (MCP-specific)
```bash
# MCP Server Configuration
MCP_LOG_LEVEL="INFO"
MCP_DEBUG="false"
MCP_TIMEOUT="30000"

# Server Ports (if using networked MCP)
DATABASE_SERVER_PORT="8001"
API_SERVER_PORT="8002"
FILE_SERVER_PORT="8003"
DEPLOYMENT_SERVER_PORT="8004"
```

## 🗄️ Database MCP Server

### mcp-servers/database-server.py
```python
#!/usr/bin/env python3

import os
import asyncio
import logging
from typing import Any, Dict, List
import asyncpg
from mcp.server import Server
from mcp.types import TextContent, Tool

logger = logging.getLogger(__name__)
server = Server("nextjs-database-server")

class NextJSDatabase:
    def __init__(self):
        self.pool = None
    
    async def initialize(self):
        """Initialize database connection"""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL not provided")
        
        self.pool = await asyncpg.create_pool(database_url)
        logger.info("Database connection established")
    
    async def get_table_info(self, table_name: str) -> List[Dict]:
        """Get table schema information"""
        query = """
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, table_name)
            return [dict(row) for row in rows]
    
    async def execute_safe_query(self, query: str, params: List = None) -> List[Dict]:
        """Execute a safe SELECT query"""
        # Ensure it's a SELECT query
        if not query.strip().upper().startswith("SELECT"):
            raise ValueError("Only SELECT queries are allowed")
        
        async with self.pool.acquire() as conn:
            if params:
                rows = await conn.fetch(query, *params)
            else:
                rows = await conn.fetch(query)
            
            return [dict(row) for row in rows]
    
    async def get_user_data(self, user_id: str) -> Dict:
        """Get user data by ID"""
        query = "SELECT id, name, email, created_at FROM users WHERE id = $1"
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None

db = NextJSDatabase()

@server.list_tools()
async def list_tools() -> List[Tool]:
    return [
        Tool(
            name="get_table_schema",
            description="Get schema information for a database table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table to inspect"
                    }
                },
                "required": ["table_name"]
            }
        ),
        Tool(
            name="query_users",
            description="Query user data with filters",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Limit number of results",
                        "default": 10
                    },
                    "search": {
                        "type": "string",
                        "description": "Search term for name or email"
                    }
                }
            }
        ),
        Tool(
            name="get_user_by_id",
            description="Get specific user by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID to fetch"
                    }
                },
                "required": ["user_id"]
            }
        ),
        Tool(
            name="execute_query",
            description="Execute a safe SELECT query",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SELECT query to execute"
                    },
                    "params": {
                        "type": "array",
                        "description": "Query parameters",
                        "items": {"type": "string"}
                    }
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    try:
        if name == "get_table_schema":
            table_name = arguments["table_name"]
            schema = await db.get_table_info(table_name)
            
            return [TextContent(
                type="text",
                text=f"Schema for '{table_name}':\n{schema}"
            )]
        
        elif name == "query_users":
            limit = arguments.get("limit", 10)
            search = arguments.get("search")
            
            if search:
                query = """
                    SELECT id, name, email, created_at 
                    FROM users 
                    WHERE name ILIKE $1 OR email ILIKE $1
                    LIMIT $2
                """
                results = await db.execute_safe_query(query, [f"%{search}%", limit])
            else:
                query = "SELECT id, name, email, created_at FROM users LIMIT $1"
                results = await db.execute_safe_query(query, [limit])
            
            return [TextContent(
                type="text",
                text=f"Users found: {len(results)}\n{results}"
            )]
        
        elif name == "get_user_by_id":
            user_id = arguments["user_id"]
            user = await db.get_user_data(user_id)
            
            if user:
                return [TextContent(
                    type="text",
                    text=f"User data: {user}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"User with ID {user_id} not found"
                )]
        
        elif name == "execute_query":
            query = arguments["query"]
            params = arguments.get("params", [])
            
            results = await db.execute_safe_query(query, params)
            
            return [TextContent(
                type="text",
                text=f"Query results ({len(results)} rows):\n{results}"
            )]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}")
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]

async def main():
    await db.initialize()
    async with server:
        await server.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## 🌐 API Integration MCP Server

### mcp-servers/api-server.py
```python
#!/usr/bin/env python3

import os
import asyncio
import logging
import aiohttp
from typing import Any, Dict, List
from mcp.server import Server
from mcp.types import TextContent, Tool

logger = logging.getLogger(__name__)
server = Server("nextjs-api-server")

class APIClient:
    def __init__(self):
        self.base_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api")
        self.secret = os.getenv("API_SECRET")
        self.session = None
    
    async def initialize(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.secret}",
                "Content-Type": "application/json"
            }
        )
        logger.info("API client initialized")
    
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    async def get_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make GET request to API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with self.session.get(url, params=params) as response:
            response.raise_for_status()
            return await response.json()
    
    async def post_request(self, endpoint: str, data: Dict) -> Dict:
        """Make POST request to API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with self.session.post(url, json=data) as response:
            response.raise_for_status()
            return await response.json()
    
    async def health_check(self) -> Dict:
        """Check API health"""
        try:
            return await self.get_request("/health")
        except Exception as e:
            return {"status": "error", "message": str(e)}

api_client = APIClient()

@server.list_tools()
async def list_tools() -> List[Tool]:
    return [
        Tool(
            name="api_health_check",
            description="Check the health status of the Next.js API",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_api_data",
            description="Fetch data from a specific API endpoint",
            inputSchema={
                "type": "object",
                "properties": {
                    "endpoint": {
                        "type": "string",
                        "description": "API endpoint path (e.g., 'users', 'posts/123')"
                    },
                    "params": {
                        "type": "object",
                        "description": "Query parameters"
                    }
                },
                "required": ["endpoint"]
            }
        ),
        Tool(
            name="post_api_data",
            description="Send data to a specific API endpoint",
            inputSchema={
                "type": "object",
                "properties": {
                    "endpoint": {
                        "type": "string",
                        "description": "API endpoint path"
                    },
                    "data": {
                        "type": "object",
                        "description": "Data to send"
                    }
                },
                "required": ["endpoint", "data"]
            }
        ),
        Tool(
            name="test_auth_endpoints",
            description="Test authentication-related endpoints",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    try:
        if name == "api_health_check":
            health = await api_client.health_check()
            return [TextContent(
                type="text",
                text=f"API Health: {health}"
            )]
        
        elif name == "get_api_data":
            endpoint = arguments["endpoint"]
            params = arguments.get("params", {})
            
            data = await api_client.get_request(endpoint, params)
            
            return [TextContent(
                type="text",
                text=f"API Response from {endpoint}:\n{data}"
            )]
        
        elif name == "post_api_data":
            endpoint = arguments["endpoint"]
            data = arguments["data"]
            
            response = await api_client.post_request(endpoint, data)
            
            return [TextContent(
                type="text",
                text=f"API Response from POST {endpoint}:\n{response}"
            )]
        
        elif name == "test_auth_endpoints":
            auth_tests = []
            
            # Test user profile endpoint
            try:
                profile = await api_client.get_request("/auth/profile")
                auth_tests.append(f"Profile endpoint: ✅ {profile}")
            except Exception as e:
                auth_tests.append(f"Profile endpoint: ❌ {str(e)}")
            
            # Test session endpoint
            try:
                session = await api_client.get_request("/auth/session")
                auth_tests.append(f"Session endpoint: ✅ {session}")
            except Exception as e:
                auth_tests.append(f"Session endpoint: ❌ {str(e)}")
            
            return [TextContent(
                type="text",
                text=f"Auth endpoint tests:\n" + "\n".join(auth_tests)
            )]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}")
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]

async def main():
    await api_client.initialize()
    try:
        async with server:
            await server.run()
    finally:
        await api_client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## 📁 File Management MCP Server

### mcp-servers/file-manager.py
```python
#!/usr/bin/env python3

import os
import asyncio
import logging
import aiofiles
from pathlib import Path
from typing import Any, Dict, List
from mcp.server import Server
from mcp.types import TextContent, Tool

logger = logging.getLogger(__name__)
server = Server("nextjs-file-manager")

class FileManager:
    def __init__(self):
        self.upload_dir = Path(os.getenv("UPLOAD_DIR", "./public/uploads"))
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
        
        # Ensure upload directory exists
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def is_safe_path(self, file_path: Path) -> bool:
        """Check if file path is safe (no directory traversal)"""
        try:
            # Resolve the path and check if it's within allowed directories
            resolved = file_path.resolve()
            return str(resolved).startswith(str(self.upload_dir.resolve()))
        except Exception:
            return False
    
    async def list_files(self, directory: str = "") -> List[Dict]:
        """List files in directory"""
        target_dir = self.upload_dir / directory if directory else self.upload_dir
        
        if not self.is_safe_path(target_dir):
            raise ValueError("Invalid directory path")
        
        if not target_dir.exists():
            return []
        
        files = []
        for item in target_dir.iterdir():
            if item.is_file():
                stat = item.stat()
                files.append({
                    "name": item.name,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "type": "file"
                })
            elif item.is_dir():
                files.append({
                    "name": item.name,
                    "type": "directory"
                })
        
        return files
    
    async def read_file(self, file_path: str) -> str:
        """Read file content"""
        target_file = self.upload_dir / file_path
        
        if not self.is_safe_path(target_file) or not target_file.exists():
            raise ValueError("File not found or invalid path")
        
        async with aiofiles.open(target_file, 'r', encoding='utf-8') as f:
            return await f.read()
    
    async def write_file(self, file_path: str, content: str) -> Dict:
        """Write content to file"""
        target_file = self.upload_dir / file_path
        
        if not self.is_safe_path(target_file):
            raise ValueError("Invalid file path")
        
        # Create parent directories if needed
        target_file.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(target_file, 'w', encoding='utf-8') as f:
            await f.write(content)
        
        return {
            "path": str(target_file.relative_to(self.upload_dir)),
            "size": len(content.encode('utf-8'))
        }
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        target_file = self.upload_dir / file_path
        
        if not self.is_safe_path(target_file) or not target_file.exists():
            raise ValueError("File not found or invalid path")
        
        target_file.unlink()
        return True

file_manager = FileManager()

@server.list_tools()
async def list_tools() -> List[Tool]:
    return [
        Tool(
            name="list_files",
            description="List files in the upload directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory": {
                        "type": "string",
                        "description": "Subdirectory to list (optional)"
                    }
                }
            }
        ),
        Tool(
            name="read_file",
            description="Read content of a text file",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to read"
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="write_file",
            description="Write content to a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path where to write the file"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write"
                    }
                },
                "required": ["file_path", "content"]
            }
        ),
        Tool(
            name="delete_file",
            description="Delete a file",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file to delete"
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="organize_uploads",
            description="Organize uploaded files by date",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    try:
        if name == "list_files":
            directory = arguments.get("directory", "")
            files = await file_manager.list_files(directory)
            
            return [TextContent(
                type="text",
                text=f"Files in {directory or 'root'}:\n{files}"
            )]
        
        elif name == "read_file":
            file_path = arguments["file_path"]
            content = await file_manager.read_file(file_path)
            
            return [TextContent(
                type="text",
                text=f"Content of {file_path}:\n{content}"
            )]
        
        elif name == "write_file":
            file_path = arguments["file_path"]
            content = arguments["content"]
            
            result = await file_manager.write_file(file_path, content)
            
            return [TextContent(
                type="text",
                text=f"File written: {result}"
            )]
        
        elif name == "delete_file":
            file_path = arguments["file_path"]
            success = await file_manager.delete_file(file_path)
            
            return [TextContent(
                type="text",
                text=f"File {'deleted' if success else 'not deleted'}: {file_path}"
            )]
        
        elif name == "organize_uploads":
            # Implementation for organizing files by date
            files = await file_manager.list_files()
            organized_count = 0
            
            # This would implement the actual organization logic
            # For now, just return the count
            
            return [TextContent(
                type="text",
                text=f"Organized {organized_count} files by date"
            )]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}")
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]

async def main():
    async with server:
        await server.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## 🚀 Setup Scripts

### scripts/setup-mcp.sh
```bash
#!/bin/bash

# Next.js MCP Setup Script

set -e

echo "🚀 Setting up MCP for Next.js project..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found"
    exit 1
fi

# Create virtual environment for MCP servers
echo "📦 Creating Python virtual environment..."
python3 -m venv .venv-mcp
source .venv-mcp/bin/activate

# Install MCP dependencies
echo "📥 Installing MCP dependencies..."
pip install mcp asyncpg aiofiles aiohttp

# Create MCP servers directory
mkdir -p mcp-servers

# Set up environment files
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local template..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_db"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
API_SECRET="your-api-secret-here"

# File Upload
MAX_FILE_SIZE="10485760"
UPLOAD_DIR="./public/uploads"
EOF
fi

if [ ! -f .env.mcp ]; then
    echo "📝 Creating .env.mcp template..."
    cat > .env.mcp << EOF
# MCP Server Configuration
MCP_LOG_LEVEL="INFO"
MCP_DEBUG="false"
MCP_TIMEOUT="30000"
EOF
fi

# Make MCP servers executable
chmod +x mcp-servers/*.py

# Create uploads directory
mkdir -p public/uploads

echo "✅ MCP setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your actual configuration"
echo "2. Start your Next.js application: npm run dev"
echo "3. Start Claude Code: claude"
echo "4. Test MCP servers with: claude --mcp-debug"
```

### scripts/start-dev.sh
```bash
#!/bin/bash

# Development startup script with MCP

set -e

echo "🚀 Starting Next.js development with MCP..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -f .env.mcp ]; then
    export $(cat .env.mcp | grep -v '^#' | xargs)
fi

# Activate Python virtual environment
if [ -d .venv-mcp ]; then
    source .venv-mcp/bin/activate
fi

# Start Next.js development server in background
echo "🌐 Starting Next.js server..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 3

# Start Claude Code with MCP debugging
echo "🤖 Starting Claude Code with MCP debugging..."
claude --mcp-debug

# Cleanup on exit
trap "kill $NEXTJS_PID" EXIT

wait
```

## 📋 CLAUDE.md Integration

Add to your project's CLAUDE.md:

```markdown
# Next.js Project with MCP Integration

## MCP Servers Available
- **Database**: Query and manage PostgreSQL database
- **API Client**: Test and interact with Next.js API routes
- **File Manager**: Handle file uploads and organization
- **Deployment**: Manage Vercel deployments

## Common MCP Operations

### Database Operations
- Get table schema: Use `get_table_schema` tool
- Query users: Use `query_users` tool with search/filters
- Execute safe queries: Use `execute_query` tool

### API Testing
- Health check: Use `api_health_check` tool
- Test endpoints: Use `get_api_data` and `post_api_data` tools
- Auth testing: Use `test_auth_endpoints` tool

### File Management
- List uploads: Use `list_files` tool
- Read/write files: Use `read_file` and `write_file` tools
- Organize files: Use `organize_uploads` tool

## Development Workflow
1. Start development: `./scripts/start-dev.sh`
2. Make changes to components/pages
3. Test with MCP tools
4. Deploy when ready

## MCP Configuration
- Project config: `.mcp.json`
- Environment: `.env.local` and `.env.mcp`
- Servers: `mcp-servers/` directory

@mcp-servers/database-server.py
@mcp-servers/api-server.py
@mcp-servers/file-manager.py
@scripts/setup-mcp.sh
```

---

**Usage Instructions:**
1. Copy the template structure to your Next.js project
2. Run `./scripts/setup-mcp.sh` to initialize MCP
3. Update environment variables in `.env.local`
4. Start development with `./scripts/start-dev.sh`
5. Use Claude Code with MCP tools for enhanced development