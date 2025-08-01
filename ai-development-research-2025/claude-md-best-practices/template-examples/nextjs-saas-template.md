# CLAUDE.md Template: Next.js SaaS Application

*Production-ready template for Next.js SaaS applications*

```markdown
# SaaS Platform: [Your App Name]

## 🚀 Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript 5.2
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **Backend**: Next.js API routes, tRPC for type safety
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Google, GitHub, email)
- **Payments**: Stripe integration
- **Email**: Resend for transactional emails
- **Deployment**: Vercel + PlanetScale/Supabase

## 📂 Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Protected routes
│   │   ├── settings/
│   │   └── billing/
│   ├── api/              # API routes
│   │   ├── auth/
│   │   ├── trpc/
│   │   └── webhooks/
│   └── globals.css
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── marketing/        # Landing page components
│   └── layout/           # Layout components
├── lib/                  # Core utilities
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client
│   ├── stripe.ts        # Stripe client
│   ├── email.ts         # Email utilities
│   ├── trpc/            # tRPC setup
│   └── utils.ts         # Helper functions
├── server/               # Server-side code
│   ├── api/             # tRPC routers
│   └── db/              # Database utilities
├── types/                # TypeScript definitions
└── prisma/              # Database schema
    ├── schema.prisma
    └── migrations/
```

## 🛠️ Development Commands
- `npm run dev`: Development server (localhost:3000)
- `npm run build`: Production build with type checking
- `npm run start`: Start production server
- `npm run test`: Jest test suite
- `npm run test:watch`: Watch mode testing
- `npm run typecheck`: TypeScript validation
- `npm run lint`: ESLint + Prettier check
- `npm run lint:fix`: Auto-fix linting issues
- `npm run db:push`: Push Prisma schema to database
- `npm run db:studio`: Open Prisma Studio
- `npm run db:migrate`: Create new migration
- `npm run generate`: Generate Prisma client

## 🎨 Code Style & Patterns

### Component Patterns
- **Server Components**: Default for data fetching
- **Client Components**: Interactive elements, hooks usage
- **File naming**: PascalCase for components, kebab-case for utilities
- **Exports**: Default exports for components, named for utilities

### Import Organization
```typescript
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'

// 3. Internal imports
import { api } from '@/lib/trpc/client'
import type { User } from '@/types/auth'
```

### TypeScript Guidelines
- Strict mode enabled
- No `any` types - use `unknown` for dynamic content
- Interface over type for object shapes
- Const assertions for literal types
- Generic constraints for reusable components

### Database Patterns
```typescript
// Good: Type-safe queries with Prisma
const user = await db.user.findUnique({
  where: { id: userId },
  include: { subscription: true }
})

// Good: Transaction handling
await db.$transaction(async (tx) => {
  await tx.user.update({ ... })
  await tx.subscription.create({ ... })
})
```

## 🔐 Authentication Flow
- NextAuth.js with database sessions
- OAuth providers: Google, GitHub
- Email/password with verification
- Protected routes with middleware
- Role-based access control (RBAC)

## 💳 Stripe Integration
- Subscription management
- Webhook handling for events
- Customer portal integration
- Usage-based billing support
- Tax calculation with Stripe Tax

## 📧 Email System
- Transactional emails via Resend
- Email templates in React components
- Welcome series automation
- Billing notifications
- Password reset flow

## 🧪 Testing Strategy
- **Unit**: Jest + React Testing Library
- **API**: API route testing with MSW
- **E2E**: Playwright for critical flows
- **Database**: Separate test database
- **Coverage**: Minimum 80% for business logic

## 🚀 Deployment Configuration
- **Vercel**: Frontend and API routes
- **Database**: PlanetScale (MySQL) or Supabase (PostgreSQL)
- **File Storage**: Vercel Blob or AWS S3
- **Monitoring**: Vercel Analytics + Sentry
- **Environment**: Staging and production environments

## 🔧 Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For migrations

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email
RESEND_API_KEY="re_..."
```

## 📋 Development Workflow
1. Create feature branch: `feature/user-dashboard`
2. Run type checking: `npm run typecheck`
3. Write tests for new features
4. Update database schema if needed
5. Test API endpoints with proper error handling
6. Commit with conventional commits: `feat: add user dashboard`
7. Open PR with description and screenshots
8. Deploy to staging for testing
9. Merge after review and CI passes

## 🔍 Common Patterns

### API Error Handling
```typescript
import { TRPCError } from '@trpc/server'

export const userRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.userId }
      })
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }
      
      return user
    })
})
```

### Form Handling
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema } from '@/lib/validations/user'

export function ProfileForm() {
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' }
  })

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  return (
    <Form {...form}>
      {/* Form implementation */}
    </Form>
  )
}
```

### Subscription Checks
```typescript
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function requireSubscription() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id }
  })

  if (!subscription || subscription.status !== 'active') {
    redirect('/billing')
  }

  return subscription
}
```

## 🔗 External Documentation
@docs/api-design.md
@docs/database-schema.md
@docs/deployment-guide.md
@docs/stripe-integration.md
@docs/email-templates.md

## 📝 Notes for AI Assistant
- Always validate user input with Zod schemas
- Use server actions for form submissions when possible
- Implement proper error boundaries
- Follow the established file structure
- Use TypeScript strict mode features
- Implement proper loading states with Suspense
- Use optimistic updates for better UX
- Always handle edge cases in API routes
```

---

**Usage Notes:**
- Customize the app name and specific tech choices
- Add/remove sections based on your project needs
- Update environment variables for your setup
- Modify authentication providers as needed
- Adjust database schema references