# Figma-to-React Debugging & Deployment Guide

## Context: What You're Receiving

You are receiving React code that was generated from a Figma design using a design-to-code tool (Figma Make, Builder.io, Locofy, etc.). This code is **NOT rendering identically** to the original Figma design in the development environment.

### Expected Behavior
The React components should render pixel-perfect (or very close) to the original Figma design across different browsers and screen sizes.

### Current Problem
The generated code has visual discrepancies including typography, spacing, colors, layout positioning, or responsive behavior that doesn't match the Figma source.

---

## Phase 1: Initial Assessment Protocol

### Step 1: Environment Verification
```bash
# Verify development environment is running
npm run dev
# or
yarn dev

# Check if the app loads without errors
open http://localhost:3000
```

### Step 2: Console Error Check
```bash
# Check browser console for:
- JavaScript errors
- CSS parsing errors
- Missing font/asset warnings
- Network request failures
```

### Step 3: Compare Side-by-Side
1. Open the Figma design file
2. Open your running React app
3. Take screenshots or use overlay tools (Pixel Perfect browser extension)
4. Document specific differences you observe

---

## Phase 2: Systematic Problem Identification

### Typography Issues Checklist
- [ ] **Font Family**: Is the correct font loaded and applied?
- [ ] **Font Weight**: Does the weight (400, 500, 600, 700) match Figma?
- [ ] **Font Size**: Are text sizes identical to Figma specs?
- [ ] **Line Height**: Does text spacing match Figma line-height?
- [ ] **Letter Spacing**: Is character spacing consistent?
- [ ] **Text Color**: Are text colors using exact hex values?

### Layout & Spacing Issues Checklist
- [ ] **Container Dimensions**: Do parent containers match Figma frame sizes?
- [ ] **Padding/Margins**: Are internal and external spacing values correct?
- [ ] **Element Positioning**: Are elements positioned as intended (not overlapping/misaligned)?
- [ ] **Flexbox/Grid**: Is CSS layout method appropriate for the design?
- [ ] **Gap Spacing**: Are gaps between elements consistent with Figma?

### Color & Visual Issues Checklist
- [ ] **Background Colors**: Do backgrounds use exact hex values from Figma?
- [ ] **Border Colors**: Are border colors and widths correct?
- [ ] **Shadow Effects**: Are drop shadows/box-shadows implemented?
- [ ] **Border Radius**: Are rounded corners matching Figma values?
- [ ] **Opacity/Transparency**: Are alpha values correct?

### Responsive & Layout Issues Checklist
- [ ] **Breakpoint Behavior**: Does layout adapt correctly at different screen sizes?
- [ ] **Overflow Handling**: Is content contained properly within containers?
- [ ] **Image Sizing**: Are images scaling and positioning correctly?
- [ ] **Text Wrapping**: Does text flow naturally without breaking layout?

---

## Phase 3: Debugging Workflow

### Step 1: Extract Design Specifications
```bash
# Open Figma and document exact values:
```

**Create a design tokens reference:**
```typescript
// design-tokens.ts
export const figmaSpecs = {
  colors: {
    primary: '#1234FF',    // Extract from Figma color picker
    secondary: '#5678AA',
    text: '#333333',
    background: '#FFFFFF',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    sizes: {
      h1: '32px',          // Exact px values from Figma
      h2: '24px',
      body: '16px',
      caption: '14px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      h1: '40px',          // Convert Figma line-height
      body: '24px',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  }
}
```

### Step 2: Validate Font Loading
```typescript
// Check if custom fonts are properly loaded
// In _app.tsx or layout component:

import { Inter } from 'next/font/google'
// or for custom fonts:
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

// Apply: className={inter.className}
```

### Step 3: Fix Typography Issues
```css
/* Compare computed styles in browser DevTools with Figma specs */
.text-element {
  font-family: 'Inter', sans-serif;
  font-size: 16px;                    /* Match Figma exactly */
  font-weight: 500;                   /* Match Figma weight */
  line-height: 24px;                  /* Convert Figma line-height */
  letter-spacing: 0.01em;             /* Convert Figma tracking */
  color: #333333;                     /* Exact hex from Figma */
}
```

### Step 4: Fix Layout and Spacing
```typescript
// Replace absolute positioning with flexbox/grid
// Before (problematic):
<div style={{ position: 'absolute', top: '20px', left: '30px' }}>

// After (responsive):
<div className="flex flex-col gap-4 p-6">
```

```css
/* Use exact spacing values from Figma */
.container {
  padding: 24px;                      /* Exact padding from Figma */
  gap: 16px;                          /* Exact gap from Figma */
  max-width: 1200px;                  /* Container width from Figma */
  margin: 0 auto;                     /* Center container */
}
```

### Step 5: Fix Color Discrepancies
```typescript
// Create a color system that matches Figma exactly
const colors = {
  primary: '#1234FF',               // Copy exact hex from Figma
  primaryHover: '#0F2BDB',          // Define hover states
  secondary: '#5678AA',
  text: {
    primary: '#333333',
    secondary: '#666666',
    muted: '#999999',
  }
}

// Use in components:
<button className="bg-[#1234FF] text-white">  {/* Exact hex */}
```

---

## Phase 4: Testing & Validation

### Browser Testing Protocol
```bash
# Test in multiple browsers:
1. Chrome (primary development)
2. Safari (closest to Figma rendering)
3. Firefox
4. Edge

# For each browser, check:
- Typography rendering
- Layout positioning
- Color accuracy
- Responsive behavior
```

### Pixel-Perfect Validation
```bash
# Install browser extensions:
# - Pixel Perfect Pro
# - Perfect Pixel

# Steps:
1. Take screenshot of Figma design
2. Overlay screenshot on your live React app
3. Adjust opacity to 50%
4. Identify pixel-level differences
5. Fix discrepancies in CSS
```

### Responsive Testing
```bash
# Test these breakpoints:
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px, 1920px

# Check for:
- Text readability
- Element overlap
- Content overflow
- Touch target sizes (minimum 44px)
```

### Performance Validation
```bash
# Run Lighthouse audit
npm run build
npm run start
# Open DevTools > Lighthouse > Performance

# Check for:
- Cumulative Layout Shift (CLS)
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
```

---

## Phase 5: Common Fixes & Code Examples

### Fix 1: Typography Alignment
```typescript
// Problem: Text doesn't align with Figma baseline
// Solution: Use consistent line-height and remove browser defaults

.typography-fix {
  margin: 0;                          /* Remove browser defaults */
  padding: 0;
  line-height: 1.5;                   /* Consistent line-height */
  font-feature-settings: "kern" 1;    /* Enable kerning */
}
```

### Fix 2: Container Sizing
```typescript
// Problem: Container doesn't match Figma frame
// Solution: Use exact dimensions with responsive behavior

<div className="
  w-full max-w-[1200px] mx-auto      // Match Figma container width
  px-4 md:px-6 lg:px-8               // Responsive padding
  py-8 md:py-12                      // Responsive vertical spacing
">
```

### Fix 3: Button Components
```typescript
// Problem: Button doesn't match Figma specs
// Solution: Exact padding, typography, and states

const Button = ({ children, variant = 'primary' }) => {
  const baseStyles = "
    inline-flex items-center justify-center
    px-6 py-3                         // Exact padding from Figma
    text-base font-medium             // Exact typography
    rounded-lg                        // Exact border-radius
    transition-colors duration-200    // Smooth interactions
  "
  
  const variants = {
    primary: "bg-[#1234FF] text-white hover:bg-[#0F2BDB]",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
  }
  
  return (
    <button className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </button>
  )
}
```

### Fix 4: Grid Layouts
```typescript
// Problem: Card grid doesn't match Figma layout
// Solution: CSS Grid with exact spacing

<div className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-6                               // Exact gap from Figma
  max-w-7xl mx-auto
  px-4 sm:px-6 lg:px-8
">
```

---

## Phase 6: Deployment Verification

### Pre-Deployment Checklist
- [ ] All fonts load correctly in production build
- [ ] Images and assets are optimized and load properly
- [ ] CSS is minified without breaking styles
- [ ] Responsive design works across devices
- [ ] Performance scores meet requirements (>90 Lighthouse)
- [ ] Cross-browser compatibility verified

### Build & Deploy Commands
```bash
# Create production build
npm run build

# Test production build locally
npm run start

# Deploy (adjust for your platform)
npm run deploy
# or
vercel deploy
# or
npm run build && aws s3 sync build/ s3://your-bucket
```

### Post-Deployment Testing
```bash
# Test on live URL across devices:
1. Mobile (iOS Safari, Android Chrome)
2. Tablet (iPad Safari, Android Chrome)
3. Desktop (Chrome, Safari, Firefox, Edge)

# Verify:
- All fonts load
- Images display correctly
- Interactions work
- Page load speed acceptable
- No console errors
```

---

## Phase 7: Documentation & Handoff

### Document Changes Made
```markdown
## Changes from Figma Export

### Typography Fixes
- Changed font-weight from 400 to 500 for better readability
- Adjusted line-height from 1.2 to 1.5 for accessibility

### Layout Adjustments
- Replaced absolute positioning with flexbox for responsiveness
- Added mobile breakpoints not present in Figma

### Color Corrections
- Updated primary blue from #1234FF to #1234FE for better contrast
- Added hover states not defined in Figma

### Performance Optimizations
- Lazy loaded images below the fold
- Added font-display: swap for better loading
```

### Maintenance Notes
```typescript
// Leave comments for future developers
const Component = () => {
  return (
    <div className="mt-[18px]"> {/* Figma: 16px, adjusted to 18px for visual balance - approved by design team */}
      {/* Component content */}
    </div>
  )
}
```

---

## Emergency Debugging Commands

If stuck, try these diagnostic commands:

```bash
# Check for conflicting CSS
npm run build && npm run start
# Open DevTools > Computed styles

# Reset node_modules if font issues persist
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm ls

# Validate TypeScript
npx tsc --noEmit

# Check bundle size for performance issues
npm install -g webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

---

## Success Criteria

✅ **Visual Accuracy**: Component matches Figma design within 2-3px tolerance  
✅ **Responsive Design**: Layout adapts properly across all screen sizes  
✅ **Performance**: Lighthouse score >90 for Performance  
✅ **Cross-Browser**: Consistent rendering in Chrome, Safari, Firefox, Edge  
✅ **Accessibility**: Meets WCAG 2.1 AA standards  
✅ **Maintainability**: Code follows project conventions and is well-documented  

Remember: Perfect pixel matching isn't always necessary. "Pixel pretty close" while maintaining good code quality and performance is often the right balance.