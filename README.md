# Situ8 Prototype

Enterprise security platform with real-time command center interface.

## 🚀 Live Demo

**Deployed URL:** [Coming soon - Deploy via Vercel dashboard](https://vercel.com/new/clone?repository-url=https://github.com/Baker21ai/situ8-prototype)

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture

### Three-Panel Command Center Layout
```
┌─────────────────────────────────────────────────────┐
│ Header: Situ8 logo, time, critical alerts          │
├────────────┬───────────────┬───────────────────────┤
│ LEFT       │ CENTER        │ RIGHT                 │
│ Activities │ Interactive   │ Timeline              │
│ Stream     │ Map           │ (Incidents/Comms)     │
└────────────┴───────────────┴───────────────────────┘
```

### Key Components
- `App.tsx` - Main navigation shell
- `CommandCenter.tsx` - Stable three-panel layout  
- `CommandCenter_new.tsx` - Latest development version
- `InteractiveMap.tsx` - Multi-level site navigation
- `EnterpriseActivityManager.tsx` - Real-time activity stream
- `Timeline.tsx` - Dual-mode incidents/communications

## 🎨 Design System

Built with:
- **React + TypeScript** - Core framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component primitives
- **Framer Motion** - Animations
- **Lucide React** - Icon system

## 📱 Features

- ✅ Real-time security activity monitoring
- ✅ Interactive multi-level facility maps
- ✅ Guard management and tracking
- ✅ Communications hub with radio integration
- ✅ Incident timeline and reporting
- ✅ Responsive design for command centers
- ✅ Enterprise-scale data handling (5000+ activities)

## 🏢 Enterprise Configuration

Supports 30+ facilities with:
- Site-level organization
- Building and floor navigation
- Personnel assignment tracking
- Priority-based activity filtering
- Real-time status updates

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives
│   ├── atoms/          # Atomic design components
│   ├── molecules/      # Compound components
│   └── organisms/      # Complex features
├── lib/                # Utilities and types
├── styles/             # Global CSS and design tokens
└── design-iterations/  # Design exploration variants
```

### Available Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint validation

## 📈 Performance

Optimized for:
- Command center displays (1920x1080+)
- Real-time data updates
- Large dataset handling
- 24/7 operational reliability

## 🚀 Deployment

### Automatic Deployment
Every push to `main` branch triggers automatic deployment via Vercel.

### Manual Deployment
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

## 📄 License

Enterprise security platform prototype - All rights reserved.