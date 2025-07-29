# How to View the Design Iterations

## Quick Start

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to the Design Showcase**:
   - Look for the **"Design Showcase"** option in the sidebar navigation (it has a purple palette icon 🎨)
   - Click on it to open the design viewer

## Using the Design Showcase

### Design Selection
At the top, you'll see three design cards:
- **Minimalist Modern** - Clean, professional interface
- **Glass Morphism** - Translucent panels with holographic effects
- **Tactical Dark** - Military-grade interface with HUD elements

Click on any design card to switch between iterations.

### View Selection
Below the design cards, you can switch between three views:
- **Command Center** - The main three-panel security dashboard
- **Activities** - The enterprise activity management interface
- **Communications** - Full-page communications center (click the button to open)

### Features
- All designs are fully interactive
- Each design maintains the same functionality with different aesthetics
- The showcase remembers your selected design as you switch between views
- Communications pages include a "back" button to return to the showcase

## Alternative: Direct Component Access

If you prefer to see individual components directly, you can modify `App.tsx` to import specific designs:

```typescript
// Replace the default imports at the top of App.tsx:
import { CommandCenter } from './design-iterations/01-minimalist-modern/CommandCenter_Modern';
// or
import { CommandCenter } from './design-iterations/02-glass-morphism/CommandCenter_Glass';
// or
import { CommandCenter } from './design-iterations/03-tactical-dark/CommandCenter_Tactical';
```

## Design Structure

Each design iteration includes:
- **CommandCenter** - Main dashboard with activities, map, and timeline
- **Activities** - Full activity management with stats
- **CommunicationsPage** - Comprehensive communications interface
- **CSS file** - Complete styling system for that design

All designs share:
- `/shared/design-tokens.css` - Common design variables
- `/shared/common-animations.css` - Reusable animations

## Notes
- All designs are optimized for dark mode (24/7 operations)
- Each design is fully responsive
- Designs use the same mock data for consistency
- All interactive elements are functional