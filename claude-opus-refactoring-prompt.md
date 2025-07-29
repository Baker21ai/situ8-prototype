# Claude Opus Component Standardization Analysis Prompt

## Context
You are analyzing a React/TypeScript security platform application called Situ8. This is a real-world production codebase that needs component standardization and design system creation. The developer is learning software engineering principles and needs a comprehensive, actionable plan.

## Your Mission
Analyze the entire codebase and create a detailed component refactoring and design system implementation plan. Think like a senior software architect who needs to transform this working application into a maintainable, scalable, professional-grade system.

## Codebase Overview
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Library**: Custom components + shadcn/ui components
- **Domain**: Security platform with activities, communications, guard management
- **Current State**: Functional but has component duplication and inconsistent patterns

## Analysis Requirements

### 1. Component Inventory & Pattern Analysis
- Scan ALL files in `/components/` directory
- Identify every reusable pattern (buttons, cards, forms, modals, etc.)
- Find duplicated code and utility functions
- Map component relationships and dependencies
- Identify inconsistent naming conventions
- Document current variant/size systems

### 2. Design System Architecture Planning
Create a comprehensive plan for:
- **Atomic Design Structure** (atoms, molecules, organisms, templates)
- **Consistent Sizing System** (xs, sm, md, lg, xl)
- **Variant Standardization** (primary, secondary, destructive, etc.)
- **Responsive Patterns** (mobile-first, breakpoint strategy)
- **Theme System** (colors, typography, spacing)
- **Component Composition Patterns**

### 3. Refactoring Strategy & Implementation Plan
Provide a detailed roadmap with:
- **Phase-by-phase approach** (what to do first, second, third)
- **Risk assessment** for each change
- **Backward compatibility strategy**
- **Testing approach** for each phase
- **Performance considerations**
- **Team workflow integration**

### 4. Specific Component Recommendations
For each major component category, provide:
- **Current state analysis**
- **Proposed standardized structure**
- **Migration path from current to new**
- **Code examples** of before/after
- **Props interface design**
- **Usage examples**

### 5. Utility Function Consolidation
- Identify all duplicated utility functions
- Design centralized utility structure
- Plan for shared constants and configurations
- Type safety improvements

### 6. File Structure Reorganization
Recommend optimal folder structure for:
- Component organization
- Utility placement
- Type definitions
- Shared constants
- Documentation

## Output Format

Structure your response as a comprehensive technical document with:

### Executive Summary
- Current state assessment
- Key problems identified
- Proposed solution overview
- Expected benefits

### Detailed Analysis
- Component inventory with categorization
- Pattern analysis with examples
- Duplication report
- Inconsistency identification

### Implementation Roadmap
- **Week 1**: Foundation setup (utilities, types, base components)
- **Week 2**: Core component standardization
- **Week 3**: Advanced patterns and optimization
- **Week 4**: Documentation and testing

### Technical Specifications
- Detailed component interfaces
- Naming conventions
- File organization
- Import/export patterns
- Performance optimizations

### Code Examples
- Before/after comparisons
- New component structures
- Usage patterns
- Migration scripts

### Risk Mitigation
- Potential breaking changes
- Rollback strategies
- Testing requirements
- Deployment considerations

## Key Focus Areas

1. **ActivityCard ecosystem** - Multiple variants need standardization
2. **Utility function duplication** - formatTimeAgo, getPriorityColor, etc.
3. **Mobile/responsive patterns** - Inconsistent mobile handling
4. **Status/priority systems** - Multiple color/badge systems
5. **Form components** - Standardize input patterns
6. **Modal/dialog patterns** - Consistent overlay behavior
7. **Navigation components** - Breadcrumbs, tabs, etc.
8. **Data display components** - Tables, lists, cards

## Success Criteria

Your plan should result in:
- ✅ **50% reduction** in component duplication
- ✅ **Consistent visual language** across all components
- ✅ **Improved developer experience** with clear patterns
- ✅ **Better performance** through optimized components
- ✅ **Easier maintenance** with centralized utilities
- ✅ **Scalable architecture** for future features
- ✅ **Clear documentation** for team adoption

## Constraints & Considerations

- Must maintain current functionality during transition
- Should leverage existing shadcn/ui components where possible
- Need to consider mobile-first responsive design
- Must be implementable by a developer learning software engineering
- Should follow React/TypeScript best practices
- Performance cannot degrade during refactoring

## Deliverables Expected

1. **Comprehensive Analysis Report** (current state)
2. **Design System Specification** (target state)
3. **Implementation Roadmap** (step-by-step plan)
4. **Code Examples & Templates** (practical guidance)
5. **Migration Scripts** (automated where possible)
6. **Testing Strategy** (quality assurance)
7. **Documentation Plan** (knowledge transfer)

---

**Note**: This is a real production codebase. Provide practical, implementable solutions that balance ideal architecture with pragmatic development constraints. Focus on creating a plan that teaches software engineering principles while delivering immediate value.