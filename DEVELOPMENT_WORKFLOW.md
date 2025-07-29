# Situ8 Development Workflow

## Quick Start Commands

```bash
# Local development
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build locally

# Git workflow
git add .
git commit -m "feat: description of changes"
git push             # Auto-deploys to Vercel
```

## Iterative Development Process

### 1. Local Development
- Run `npm run dev` 
- Edit components in real-time
- Check browser at `http://localhost:5173`

### 2. Quick Deploy & Test
- Commit changes: `git add . && git commit -m "description"`
- Push: `git push`
- Check Vercel deployment (auto-triggered)

### 3. Component Development Focus Areas

**Main Components:**
- `App.tsx` - Navigation shell
- `CommandCenter.tsx` - Three-panel layout (stable)
- `CommandCenter_new.tsx` - Latest version
- `InteractiveMap.tsx` - Multi-level navigation
- `EnterpriseActivityManager.tsx` - Activity stream
- `Timeline.tsx` - Incidents/Communications

**UI Components:**
- All in `components/ui/` - shadcn/ui based
- Use relative imports: `./ui/component`

### 4. Design Iterations
Test different design approaches in `design-iterations/`:
- 01-minimalist-modern/
- 02-glass-morphism/
- 03-tactical-dark/

### 5. Mobile Testing
- Use browser dev tools for responsive testing
- Vercel provides mobile preview URLs
- Test on actual devices via deployed URL

## Environment Setup

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Development Environment Variables
Create `.env.local` for development:
```bash
VITE_APP_TITLE="Situ8 Security Platform"
VITE_NODE_ENV="development"
```

## Deployment Configuration

Your `vercel.json` is pre-configured for:
- Vite framework detection
- SPA routing support
- Automatic builds on push

## Performance Monitoring

Monitor via Vercel dashboard:
- Build times
- Bundle size
- Core Web Vitals
- Error tracking

## Troubleshooting

**Build fails:**
- Check TypeScript errors: `npm run build`
- Verify all imports are correct
- Check console for missing dependencies

**Deployment issues:**
- Check Vercel build logs
- Verify `package.json` scripts
- Test production build locally: `npm run preview`

**Styling issues:**
- Ensure `globals.css` is imported in `main.tsx`
- Check Tailwind config matches design system
- Verify component imports use relative paths