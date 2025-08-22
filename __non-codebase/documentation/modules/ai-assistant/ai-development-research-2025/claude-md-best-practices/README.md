# CLAUDE.md Best Practices Guide

*Mastering AI context files for optimal development workflows - July 2025*

## 🎯 What is CLAUDE.md?

CLAUDE.md is a special Markdown file that Claude Code automatically ingests to gain project-specific context before starting work. Think of it as your AI assistant's "briefing document" - a highly-opinionated prompt that rides along with every request.

**Key Benefits:**
- ✅ Automatic context loading on session start
- ✅ Team-wide consistency when checked into Git
- ✅ Hierarchical organization for complex projects
- ✅ Intelligent file linking and referencing

## 📁 File Placement Strategies

### 1. Project-Level CLAUDE.md
```
your-project/
├── CLAUDE.md          # Primary context file
├── src/
├── docs/
└── package.json
```

**Best for:** Single projects, consistent tech stack

### 2. Hierarchical CLAUDE.md
```
monorepo/
├── CLAUDE.md              # Global context
├── frontend/
│   └── CLAUDE.md         # Frontend-specific
├── backend/
│   └── CLAUDE.md         # Backend-specific
└── shared/
    └── CLAUDE.md         # Shared utilities
```

**Best for:** Monorepos, multi-team projects

### 3. Personal vs Team Files
```
your-project/
├── CLAUDE.md           # Team shared (check into Git)
├── CLAUDE.local.md     # Personal (.gitignore this)
└── .gitignore
```

## 🏗️ Essential Structure Template

### Minimal Effective CLAUDE.md
```markdown
# Project: [Your App Name]

## Tech Stack
- Framework: Next.js 14
- Language: TypeScript 5.2
- Styling: Tailwind CSS 3.4
- Database: PostgreSQL + Prisma

## Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run tests with Jest
- `npm run typecheck`: TypeScript validation

## Code Style
- Use ES modules (import/export)
- Destructure imports when possible
- Follow existing component patterns
- No console.log in production code

## Project Structure
- `src/app/`: Next.js App Router pages
- `src/components/`: Reusable React components
- `src/lib/`: Core utilities and API clients
- `src/types/`: TypeScript type definitions
```

### Comprehensive CLAUDE.md Template
```markdown
# Project: Advanced SaaS Platform

## 🚀 Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript 5.2
- **Styling**: Tailwind CSS 3.4, shadcn/ui components
- **Backend**: Node.js, tRPC, Prisma ORM
- **Database**: PostgreSQL (local), Supabase (production)
- **Auth**: NextAuth.js with Google/GitHub providers
- **Deployment**: Vercel (frontend), Railway (backend)

## 📂 Project Architecture
```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth route group
│   ├── dashboard/      # Protected dashboard
│   └── api/           # API routes
├── components/         # Reusable UI components
│   ├── ui/           # shadcn/ui base components
│   ├── forms/        # Form components
│   └── layout/       # Layout components
├── lib/               # Core utilities
│   ├── auth.ts       # Authentication config
│   ├── db.ts         # Database client
│   └── utils.ts      # Helper functions
├── types/             # TypeScript definitions
└── styles/           # Global styles
```

## 🛠️ Development Commands
- `npm run dev`: Start development server (localhost:3000)
- `npm run build`: Production build with type checking
- `npm run start`: Start production server
- `npm run test`: Run Jest test suite
- `npm run test:watch`: Watch mode testing
- `npm run typecheck`: TypeScript validation
- `npm run lint`: ESLint + Prettier
- `npm run db:push`: Push schema changes to database
- `npm run db:studio`: Open Prisma Studio

## 🎨 Code Style Guidelines
- **Imports**: Use absolute imports (`@/components/...`)
- **Components**: PascalCase, default exports
- **Functions**: camelCase, descriptive names
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case for utilities, PascalCase for components
- **No**: console.log, any types, unused imports

## 🔧 Configuration Files
- **ESLint**: `.eslintrc.json` - strict TypeScript rules
- **Prettier**: `.prettierrc` - 2 spaces, single quotes
- **TypeScript**: `tsconfig.json` - strict mode enabled
- **Tailwind**: `tailwind.config.js` - custom theme
- **Environment**: `.env.local` - development secrets

## 🚦 Development Workflow
1. Create feature branch from `main`
2. Run `npm run typecheck` before commits
3. Write tests for new components/utilities
4. Use conventional commits (feat:, fix:, docs:)
5. Open PR with description and screenshots
6. Merge after review and CI passes

## 🧪 Testing Strategy
- **Unit**: Jest + React Testing Library
- **Integration**: API route testing with supertest
- **E2E**: Playwright for critical user flows
- **Coverage**: Minimum 80% for new code

## 📋 Common Patterns
- Server Components by default, Client Components when needed
- Error boundaries for component error handling
- Loading states with Suspense boundaries
- Form validation with Zod schemas
- API error handling with custom error classes

## 🔗 External References
@docs/api-design.md
@docs/deployment-guide.md
@docs/troubleshooting.md
```

## 💡 Content Optimization Strategies

### 1. Keep It Concise
❌ **Too Verbose:**
```markdown
This project is built using Next.js version 14 which is the latest version of the popular React framework created by Vercel. We chose Next.js because it provides excellent developer experience, built-in optimization features, and seamless deployment to Vercel's platform...
```

✅ **Concise & Effective:**
```markdown
## Tech Stack
- Framework: Next.js 14 (App Router)
- Deployment: Vercel
- Benefits: Built-in optimization, great DX
```

### 2. Use Declarative Bullet Points
❌ **Narrative Style:**
```markdown
When you need to start the development server, you should run the npm run dev command which will start the application on port 3000.
```

✅ **Declarative Style:**
```markdown
## Commands
- `npm run dev`: Development server (port 3000)
- `npm run build`: Production build
- `npm run test`: Run test suite
```

### 3. Focus on AI-Relevant Information
**Include:**
- Tech stack versions
- File naming conventions
- Import patterns
- Code style preferences
- Common patterns to follow

**Exclude:**
- Long project history
- Team contact information
- Deployment credentials
- Verbose explanations

## 🔗 File Linking with @ Syntax

### Basic File Linking
```markdown
# Project Documentation

For detailed API documentation, see:
@docs/api-reference.md

For deployment instructions:
@docs/deployment.md

For troubleshooting common issues:
@docs/troubleshooting.md
```

### Smart Loading Behavior
Claude intelligently loads linked files only when needed:
- ✅ Question about API → Loads `@docs/api-reference.md`
- ✅ Deployment issue → Loads `@docs/deployment.md`
- ✅ Context-aware loading reduces token usage

### Linking Best Practices
```markdown
## Architecture Documentation
@docs/architecture/overview.md
@docs/architecture/database-schema.md
@docs/architecture/api-design.md

## Style Guides
@docs/code-style.md
@docs/component-patterns.md
@docs/testing-guidelines.md

## Configuration References
@config/eslint-rules.md
@config/typescript-config.md
```

## 📊 Content Effectiveness Testing

### Iterative Improvement Process
1. **Start Simple**: Basic tech stack and commands
2. **Monitor AI Responses**: Note when AI misses context
3. **Add Specific Guidance**: Address common mistakes
4. **Test & Refine**: Validate improvements over time

### A/B Testing Your CLAUDE.md

**Version A - Generic:**
```markdown
# My React App
- Uses React and TypeScript
- Run `npm start` for development
```

**Version B - Specific:**
```markdown
# E-commerce Dashboard
## Tech Stack
- React 18.2 + TypeScript 5.1
- Vite build tool
- Tailwind CSS + HeadlessUI
- React Query for data fetching

## Patterns
- Functional components with hooks
- Custom hooks in `src/hooks/`
- API calls via `useQuery`
- Error boundaries for route components
```

**Result**: Version B produces more accurate, contextual responses.

## ⚠️ Common Pitfalls to Avoid

### 1. Information Overload
❌ **Too Much Detail:**
```markdown
# Project History
This project was started in 2023 by John Smith after he realized that existing solutions didn't meet our specific needs. We evaluated React, Vue, and Angular before settling on React because of team familiarity...
[500 more lines of narrative]
```

### 2. Outdated Information
❌ **Stale Content:**
```markdown
## Tech Stack
- Node.js 14 (we're actually on 18)
- React 16 (we're on 18)
- Deprecated patterns
```

### 3. Missing Critical Context
❌ **Vague Guidelines:**
```markdown
## Code Style
- Write good code
- Follow best practices
- Be consistent
```

✅ **Specific Guidelines:**
```markdown
## Code Style
- Components: PascalCase default exports
- Hooks: camelCase starting with 'use'
- Constants: UPPER_SNAKE_CASE
- No console.log in production
- Prefer const assertions over enums
```

## 🎯 Advanced Techniques

### 1. Custom Commands Integration
```markdown
## Available Slash Commands
- `/test`: Run test suite for current file
- `/build`: Build and validate current component
- `/deploy`: Deploy to staging environment
- `/docs`: Generate component documentation
```

### 2. Environment-Specific Context
```markdown
## Environment Configuration
- **Development**: `npm run dev` (port 3000)
- **Staging**: Auto-deploy on `develop` branch
- **Production**: Manual deploy from `main` branch

## Environment Variables
- `NEXT_PUBLIC_API_URL`: API endpoint
- `DATABASE_URL`: Postgres connection
- `NEXTAUTH_SECRET`: Auth session secret
```

### 3. Team Role Context
```markdown
## Team Context
- **Frontend Lead**: @alice (React, TypeScript)
- **Backend Lead**: @bob (Node.js, Database)
- **Designer**: @carol (Figma, Design System)

## Review Process
- Frontend changes: Require @alice approval
- Backend changes: Require @bob approval
- Design changes: Require @carol approval
```

## 📈 Measuring CLAUDE.md Effectiveness

### Key Metrics
1. **Accuracy**: Does AI follow project conventions?
2. **Efficiency**: Fewer clarification requests needed?
3. **Consistency**: Same results across team members?
4. **Relevance**: Context matches actual development needs?

### Feedback Loop
```markdown
## CLAUDE.md Effectiveness Log
<!-- Update weekly with AI performance notes -->

### Week of July 24, 2025
- ✅ AI correctly used component patterns
- ❌ Missed new database schema changes
- 📝 Action: Add @docs/schema.md reference

### Week of July 31, 2025
- ✅ Improved API integration accuracy
- ✅ Consistent code style application
- 📝 Action: None needed this week
```

## 🔄 Maintenance Best Practices

### Regular Updates
- **Weekly**: Review for outdated commands/versions
- **Monthly**: Validate against actual development patterns
- **Per Release**: Update tech stack versions and patterns

### Team Synchronization
```bash
# Git hooks for CLAUDE.md validation
#!/bin/bash
# .git/hooks/pre-commit
if [ -f "CLAUDE.md" ]; then
    echo "Validating CLAUDE.md..."
    # Check for outdated versions, missing sections
fi
```

### Version Control
```markdown
<!-- CLAUDE.md version history -->
<!-- v1.0 - Initial setup (July 2025) -->
<!-- v1.1 - Added MCP configuration (July 2025) -->
<!-- v1.2 - Updated for Next.js 14 patterns (July 2025) -->
```

---

*Next: [Template Examples →](./template-examples/)*