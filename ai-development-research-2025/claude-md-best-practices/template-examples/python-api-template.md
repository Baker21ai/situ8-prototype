# CLAUDE.md Template: Python FastAPI Application

*Production-ready template for Python FastAPI applications*

```markdown
# API Service: [Your API Name]

## 🚀 Tech Stack
- **Framework**: FastAPI 0.104+ with async/await
- **Language**: Python 3.11+ (pyproject.toml managed)
- **Database**: PostgreSQL + SQLAlchemy 2.0 (async)
- **Migration**: Alembic for database migrations
- **Validation**: Pydantic v2 models
- **Authentication**: JWT tokens + OAuth2
- **Testing**: pytest + pytest-asyncio
- **Documentation**: Auto-generated OpenAPI/Swagger
- **Deployment**: Docker + Railway/Render

## 📂 Project Structure
```
project-root/
├── app/                    # Main application package
│   ├── __init__.py
│   ├── main.py            # FastAPI app instance
│   ├── config.py          # Settings and configuration
│   ├── database.py        # Database connection
│   ├── dependencies.py    # Common dependencies
│   ├── models/            # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── base.py
│   ├── schemas/           # Pydantic models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── auth.py
│   ├── routers/           # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── health.py
│   ├── services/          # Business logic
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── user.py
│   └── utils/             # Helper functions
│       ├── __init__.py
│       ├── security.py
│       └── email.py
├── tests/                 # Test files
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_users.py
├── alembic/              # Database migrations
│   ├── versions/
│   └── env.py
├── scripts/              # Utility scripts
│   ├── create_superuser.py
│   └── seed_data.py
├── docker/               # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
├── pyproject.toml        # Dependencies and config
├── alembic.ini          # Migration configuration
└── .env.example         # Environment template
```

## 🛠️ Development Commands
- `uv run fastapi dev`: Development server with auto-reload
- `uv run pytest`: Run test suite
- `uv run pytest --cov`: Run tests with coverage
- `uv run mypy app/`: Type checking
- `uv run ruff check`: Linting
- `uv run ruff format`: Code formatting
- `uv run alembic upgrade head`: Apply migrations
- `uv run alembic revision --autogenerate -m "message"`: Create migration
- `uv run python scripts/create_superuser.py`: Create admin user

## 🎨 Code Style & Patterns

### Import Organization
```python
# 1. Standard library
import asyncio
from datetime import datetime
from typing import Optional

# 2. Third-party packages
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

# 3. Local imports
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
```

### Naming Conventions
- **Files/Modules**: snake_case
- **Classes**: PascalCase
- **Functions/Variables**: snake_case
- **Constants**: UPPER_SNAKE_CASE
- **Private methods**: _leading_underscore

### Type Hints (Required)
```python
from typing import Optional, List, Dict, Any
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Good: Full type annotations
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    return await db.get(User, user_id)

# Good: Pydantic model responses
@router.get("/users/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    user = await get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)
```

### Async/Await Patterns
```python
# Good: Async database operations
async def create_user(user_data: UserCreate, db: AsyncSession) -> User:
    db_user = User(**user_data.model_dump())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# Good: Async service layer
class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
```

## 🔐 Authentication & Security

### JWT Configuration
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()

# app/utils/security.py
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

### Protected Routes Pattern
```python
from app.dependencies import get_current_user

@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    # Update logic here
    pass
```

## 🗄️ Database Patterns

### SQLAlchemy Models
```python
# app/models/base.py
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# app/models/user.py
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
```

### Repository Pattern
```python
# app/repositories/user.py
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        return await self.db.get(User, user_id)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create(self, user_data: UserCreate) -> User:
        db_user = User(**user_data.model_dump(exclude={"password"}))
        db_user.hashed_password = hash_password(user_data.password)
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user
```

## 📊 Pydantic Schemas
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserInDB(UserResponse):
    hashed_password: str
```

## 🧪 Testing Patterns
```python
# tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.database import get_db

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def db_session():
    # Test database setup
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with AsyncSession(engine) as session:
        yield session

# tests/test_auth.py
@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpassword"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
```

## 🔧 Environment Configuration
```bash
# .env
# Database
DATABASE_URL="postgresql+asyncpg://user:password@localhost/dbname"

# Security
SECRET_KEY="your-secret-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# External APIs
REDIS_URL="redis://localhost:6379"
SENTRY_DSN="https://your-sentry-dsn"

# Application
ENVIRONMENT="development"
DEBUG=true
LOG_LEVEL="INFO"
```

## 🚀 Deployment Configuration

### Docker Setup
```dockerfile
# docker/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Checklist
- [ ] Set DEBUG=false
- [ ] Use production database
- [ ] Configure proper CORS settings
- [ ] Set up error logging (Sentry)
- [ ] Enable rate limiting
- [ ] Use HTTPS only
- [ ] Set secure cookie settings
- [ ] Configure proper backup strategy

## 📋 API Design Patterns

### Error Handling
```python
from fastapi import HTTPException
from app.utils.exceptions import AppException

# Good: Consistent error responses
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "USER_NOT_FOUND",
                "message": f"User with ID {user_id} not found"
            }
        )
    return user

# Good: Custom exception handling
class UserNotFoundError(AppException):
    def __init__(self, user_id: int):
        self.status_code = 404
        self.detail = f"User with ID {user_id} not found"
```

### Response Models
```python
from typing import Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    users, total = await user_service.get_paginated(page, size)
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size
    )
```

## 🔗 External Documentation
@docs/api-design.md
@docs/database-schema.md
@docs/deployment-guide.md
@docs/authentication.md
@scripts/development-setup.md

## 📝 Notes for AI Assistant
- Always use async/await for database operations
- Include proper type hints for all functions
- Use Pydantic models for request/response validation
- Implement proper error handling with appropriate HTTP status codes
- Follow repository pattern for data access
- Use dependency injection for database sessions
- Write tests for all endpoints
- Use environment variables for configuration
- Implement proper logging throughout the application
- Follow RESTful API design principles
```

---

**Usage Notes:**
- Customize the API name and specific requirements
- Adjust database models based on your domain
- Modify authentication strategy as needed
- Update deployment configuration for your platform
- Add specific business logic patterns