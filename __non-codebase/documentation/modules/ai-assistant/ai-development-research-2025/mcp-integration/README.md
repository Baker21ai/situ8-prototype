# MCP Integration Guide: Model Context Protocol

*Comprehensive guide to MCP server setup and integration patterns - July 2025*

## 🎯 What is MCP?

**Model Context Protocol (MCP)** is an open standard that enables AI assistants to securely connect to data sources and tools. It provides a standardized way for AI models to access real-time information, execute functions, and interact with external systems.

### Core Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Hosts       │    │    Clients      │    │    Servers      │
│  (Claude Code,  │◄──►│  (Manage MCP    │◄──►│  (Expose tools  │
│   IDEs, Apps)   │    │   connections)  │    │  and resources) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Three-Tier Architecture:**
- **Hosts**: Applications users interact with (Claude Desktop, IDEs)
- **Clients**: Components within hosts that manage MCP connections
- **Servers**: Lightweight programs exposing capabilities through MCP

## 🏗️ Project Structure Best Practices

### Configuration Scope Hierarchy

#### 1. Project-Level Configuration (Highest Priority)
```json
// .mcp.json
{
  "mcpServers": {
    "project-database": {
      "command": "python",
      "args": ["/path/to/db-server.py"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/project_db"
      }
    },
    "project-api": {
      "command": "node",
      "args": ["/path/to/api-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

#### 2. User-Level Configuration (Global)
```bash
# Add global MCP server (works from any directory)
claude mcp add --scope user github-tools python3 ~/.mcp-servers/github.py

# Configuration stored in user config
~/.config/claude/mcp.json
```

#### 3. Directory-Level Configuration (Default)
```bash
# Local directory-specific server
claude mcp add local-tools python3 ./tools/local-server.py

# Configuration in current directory
./mcp.json
```

### Recommended Directory Structure
```
project-root/
├── .mcp.json                    # Project MCP configuration
├── mcp-servers/                 # Local MCP servers
│   ├── database-tools.py       # Database operations
│   ├── api-client.py           # API integrations
│   ├── file-processor.py       # File operations
│   └── deployment-tools.py     # Deployment utilities
├── tools/                       # Development utilities
│   ├── setup-mcp.sh           # MCP setup script
│   └── validate-config.py      # Configuration validator
└── docs/
    ├── mcp-setup.md            # Setup instructions
    └── server-documentation.md # Server API docs
```

## 🔧 Configuration Best Practices

### Security-First Configuration

#### Environment Variable Management
```json
{
  "mcpServers": {
    "secure-api": {
      "command": "python",
      "args": ["/path/to/api-server.py"],
      "env": {
        "API_KEY": "${API_KEY}",
        "SECRET_TOKEN": "${SECRET_TOKEN}",
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

#### Secure Environment Setup
```bash
# .env file (never commit to git)
API_KEY=your-secure-api-key
SECRET_TOKEN=your-secret-token
DATABASE_URL=postgresql://user:pass@localhost/db

# Load environment before starting Claude
export $(cat .env | xargs)
claude
```

### Development vs Production Configuration

#### Development Configuration
```json
{
  "mcpServers": {
    "dev-database": {
      "command": "python",
      "args": ["./mcp-servers/database.py"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/dev_db",
        "DEBUG": "true",
        "MOCK_EXTERNAL_APIS": "true"
      }
    }
  }
}
```

#### Production Configuration
```json
{
  "mcpServers": {
    "prod-database": {
      "command": "python",
      "args": ["/opt/mcp-servers/database.py"],
      "env": {
        "DATABASE_URL": "${PROD_DATABASE_URL}",
        "DEBUG": "false",
        "ENABLE_LOGGING": "true",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

## 🛠️ MCP Server Development Patterns

### Basic Python MCP Server Template

#### Server Structure
```python
# mcp-servers/example-server.py
#!/usr/bin/env python3

from mcp.server import Server
from mcp.types import TextContent, Tool, Resource
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MCP server
server = Server("example-server")

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="example_function",
            description="Example function that processes data",
            inputSchema={
                "type": "object",
                "properties": {
                    "input_data": {
                        "type": "string",
                        "description": "Data to process"
                    }
                },
                "required": ["input_data"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    if name == "example_function":
        input_data = arguments.get("input_data", "")
        
        # Process the input
        result = f"Processed: {input_data.upper()}"
        
        return [TextContent(
            type="text",
            text=result
        )]
    
    raise ValueError(f"Unknown tool: {name}")

@server.list_resources()
async def list_resources() -> list[Resource]:
    """List available resources"""
    return [
        Resource(
            uri="file://example.txt",
            name="Example Resource",
            description="An example resource",
            mimeType="text/plain"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read resource content"""
    if uri == "file://example.txt":
        return "This is example resource content"
    
    raise ValueError(f"Unknown resource: {uri}")

async def main():
    # Run the server
    async with server:
        await server.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### Advanced Database Integration Server

#### Database MCP Server
```python
# mcp-servers/database-server.py
#!/usr/bin/env python3

import os
import asyncio
import logging
from typing import Any, Dict, List
import asyncpg
from mcp.server import Server
from mcp.types import TextContent, Tool

logger = logging.getLogger(__name__)
server = Server("database-server")

class DatabaseManager:
    def __init__(self):
        self.pool = None
    
    async def initialize(self):
        """Initialize database connection pool"""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL not provided")
        
        self.pool = await asyncpg.create_pool(database_url)
        logger.info("Database connection pool initialized")
    
    async def execute_query(self, query: str, params: List[Any] = None) -> List[Dict]:
        """Execute a database query"""
        async with self.pool.acquire() as conn:
            if params:
                rows = await conn.fetch(query, *params)
            else:
                rows = await conn.fetch(query)
            
            return [dict(row) for row in rows]
    
    async def execute_command(self, command: str, params: List[Any] = None) -> str:
        """Execute a database command (INSERT, UPDATE, DELETE)"""
        async with self.pool.acquire() as conn:
            if params:
                result = await conn.execute(command, *params)
            else:
                result = await conn.execute(command)
            
            return result

# Initialize database manager
db_manager = DatabaseManager()

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available database tools"""
    return [
        Tool(
            name="query_database",
            description="Execute a SELECT query on the database",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SQL SELECT query to execute"
                    },
                    "params": {
                        "type": "array",
                        "description": "Query parameters",
                        "items": {"type": "string"}
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="execute_command",
            description="Execute a database command (INSERT, UPDATE, DELETE)",
            inputSchema={
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "SQL command to execute"
                    },
                    "params": {
                        "type": "array",
                        "description": "Command parameters",
                        "items": {"type": "string"}
                    }
                },
                "required": ["command"]
            }
        ),
        Tool(
            name="get_table_schema",
            description="Get the schema information for a table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table"
                    }
                },
                "required": ["table_name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls"""
    try:
        if name == "query_database":
            query = arguments["query"]
            params = arguments.get("params", [])
            
            # Basic SQL injection protection
            if not query.strip().upper().startswith("SELECT"):
                raise ValueError("Only SELECT queries are allowed")
            
            results = await db_manager.execute_query(query, params)
            
            return [TextContent(
                type="text",
                text=f"Query results:\n{results}"
            )]
        
        elif name == "execute_command":
            command = arguments["command"]
            params = arguments.get("params", [])
            
            # Validate command type
            command_upper = command.strip().upper()
            allowed_commands = ["INSERT", "UPDATE", "DELETE"]
            if not any(command_upper.startswith(cmd) for cmd in allowed_commands):
                raise ValueError("Only INSERT, UPDATE, and DELETE commands are allowed")
            
            result = await db_manager.execute_command(command, params)
            
            return [TextContent(
                type="text",
                text=f"Command executed: {result}"
            )]
        
        elif name == "get_table_schema":
            table_name = arguments["table_name"]
            
            schema_query = """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position;
            """
            
            schema = await db_manager.execute_query(schema_query, [table_name])
            
            return [TextContent(
                type="text",
                text=f"Schema for table '{table_name}':\n{schema}"
            )]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        logger.error(f"Error executing tool {name}: {e}")
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]

async def main():
    """Main server function"""
    await db_manager.initialize()
    
    async with server:
        await server.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## 🔒 Security Best Practices

### Input Validation & Sanitization

#### SQL Injection Prevention
```python
# Good: Parameterized queries
async def safe_query(self, table: str, user_id: int):
    query = "SELECT * FROM users WHERE id = $1"
    return await self.execute_query(query, [user_id])

# Bad: String concatenation
async def unsafe_query(self, table: str, user_id: str):
    query = f"SELECT * FROM {table} WHERE id = {user_id}"
    return await self.execute_query(query)  # SQL injection risk
```

#### Command Validation
```python
def validate_sql_command(command: str) -> bool:
    """Validate SQL command for security"""
    command_upper = command.strip().upper()
    
    # Whitelist allowed commands
    allowed_commands = ["SELECT", "INSERT", "UPDATE", "DELETE"]
    
    # Block dangerous operations
    blocked_keywords = ["DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"]
    
    # Check if command starts with allowed operation
    if not any(command_upper.startswith(cmd) for cmd in allowed_commands):
        return False
    
    # Check for blocked keywords
    if any(keyword in command_upper for keyword in blocked_keywords):
        return False
    
    return True
```

### Access Control Patterns

#### Role-Based Access Control
```python
# mcp-servers/secure-server.py
from enum import Enum
from typing import Dict, List

class UserRole(Enum):
    ADMIN = "admin"
    DEVELOPER = "developer"
    VIEWER = "viewer"

class AccessControl:
    def __init__(self):
        self.permissions = {
            UserRole.ADMIN: ["read", "write", "delete", "admin"],
            UserRole.DEVELOPER: ["read", "write"],
            UserRole.VIEWER: ["read"]
        }
    
    def check_permission(self, user_role: UserRole, action: str) -> bool:
        """Check if user role has permission for action"""
        return action in self.permissions.get(user_role, [])
    
    def get_user_role(self, context: Dict) -> UserRole:
        """Extract user role from context"""
        # Implementation depends on your authentication system
        return UserRole(context.get("user_role", "viewer"))

# Use in tool handlers
@server.call_tool()
async def call_tool(name: str, arguments: Dict, context: Dict = None) -> List[TextContent]:
    access_control = AccessControl()
    user_role = access_control.get_user_role(context or {})
    
    if name == "delete_data":
        if not access_control.check_permission(user_role, "delete"):
            raise PermissionError("Insufficient permissions for delete operation")
        
        # Proceed with delete operation
        pass
```

## 🚀 Deployment Patterns

### Docker-Based MCP Servers

#### Dockerfile Template
```dockerfile
# mcp-servers/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy server code
COPY *.py ./

# Create non-root user
RUN useradd -m -u 1000 mcpuser
USER mcpuser

# Expose MCP port (if using network transport)
EXPOSE 8000

# Run server
CMD ["python", "server.py"]
```

#### Docker Compose for Development
```yaml
# docker-compose.mcp.yml
version: '3.8'

services:
  database-server:
    build: ./mcp-servers
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/devdb
      - LOG_LEVEL=DEBUG
    depends_on:
      - postgres
    volumes:
      - ./mcp-servers:/app
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Production Deployment

#### Systemd Service Configuration
```ini
# /etc/systemd/system/mcp-database-server.service
[Unit]
Description=MCP Database Server
After=network.target postgresql.service

[Service]
Type=simple
User=mcpuser
Group=mcpuser
WorkingDirectory=/opt/mcp-servers
Environment=DATABASE_URL=postgresql://user:pass@localhost/prod_db
Environment=LOG_LEVEL=INFO
ExecStart=/usr/bin/python3 /opt/mcp-servers/database-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Nginx Reverse Proxy (if using HTTP transport)
```nginx
# /etc/nginx/sites-available/mcp-server
server {
    listen 80;
    server_name mcp-server.example.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Debugging & Monitoring

### Debug Configuration
```bash
# Start Claude Code with MCP debugging
claude --mcp-debug

# This enables:
# - Detailed MCP protocol logging
# - Server connection status
# - Tool call tracing
# - Error detailed reporting
```

### Logging Setup
```python
# Enhanced logging configuration
import logging
import sys
from datetime import datetime

def setup_logging(log_level: str = "INFO"):
    """Configure comprehensive logging"""
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # File handler
    file_handler = logging.FileHandler(
        f'mcp-server-{datetime.now().strftime("%Y%m%d")}.log'
    )
    file_handler.setFormatter(formatter)
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Use in server
logger = setup_logging(os.getenv("LOG_LEVEL", "INFO"))
```

### Health Check Implementation
```python
@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Enhanced tool handler with health checks"""
    
    if name == "health_check":
        try:
            # Check database connection
            await db_manager.execute_query("SELECT 1")
            
            # Check external API availability
            # ... other health checks
            
            return [TextContent(
                type="text",
                text="All systems operational"
            )]
        
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return [TextContent(
                type="text",
                text=f"Health check failed: {str(e)}"
            )]
```

## 🔗 Integration Examples

### File System Integration
```python
# mcp-servers/file-system-server.py
import os
import aiofiles
from pathlib import Path

@server.list_tools()
async def list_tools() -> List[Tool]:
    return [
        Tool(
            name="read_file",
            description="Read contents of a file",
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
                    "file_path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["file_path", "content"]
            }
        ),
        Tool(
            name="list_directory",
            description="List contents of a directory",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory_path": {"type": "string"}
                },
                "required": ["directory_path"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    if name == "read_file":
        file_path = Path(arguments["file_path"])
        
        # Security: Prevent path traversal
        if not file_path.is_file() or ".." in str(file_path):
            raise ValueError("Invalid file path")
        
        async with aiofiles.open(file_path, 'r') as f:
            content = await f.read()
        
        return [TextContent(type="text", text=content)]
    
    elif name == "write_file":
        file_path = Path(arguments["file_path"])
        content = arguments["content"]
        
        # Security checks
        if ".." in str(file_path):
            raise ValueError("Invalid file path")
        
        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(file_path, 'w') as f:
            await f.write(content)
        
        return [TextContent(type="text", text=f"File written: {file_path}")]
    
    elif name == "list_directory":
        dir_path = Path(arguments["directory_path"])
        
        if not dir_path.is_dir() or ".." in str(dir_path):
            raise ValueError("Invalid directory path")
        
        items = [item.name for item in dir_path.iterdir()]
        
        return [TextContent(type="text", text=f"Directory contents: {items}")]
```

---

*Next: [Project Structure Templates →](./project-structure-templates/)*