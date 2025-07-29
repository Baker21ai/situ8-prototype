#!/usr/bin/env node

/**
 * Component Validator Script
 * Validates React component structure, props, and exports
 */

const fs = require('fs');
const path = require('path');

function validateComponent(filePath) {
  console.log(`🔍 Validating component: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for proper TypeScript interface/type definitions
    if (!content.includes('interface ') && !content.includes('type ') && content.includes('Props')) {
      issues.push('⚠️  Consider defining Props interface/type');
    }
    
    // Check for default export
    if (!content.includes('export default')) {
      issues.push('⚠️  Component should have a default export');
    }
    
    // Check for proper component naming (PascalCase)
    const fileName = path.basename(filePath, '.tsx');
    if (fileName !== fileName.charAt(0).toUpperCase() + fileName.slice(1)) {
      issues.push('⚠️  Component file should use PascalCase naming');
    }
    
    // Check for accessibility attributes in interactive elements
    if (content.includes('<button') && !content.includes('aria-')) {
      issues.push('💡 Consider adding ARIA attributes for accessibility');
    }
    
    // Check for proper error boundaries in complex components
    if (content.includes('useState') && content.includes('useEffect') && !content.includes('try')) {
      issues.push('💡 Consider adding error handling for complex components');
    }
    
    if (issues.length === 0) {
      console.log('✅ Component validation passed');
    } else {
      console.log('📋 Component validation suggestions:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
  } catch (error) {
    console.error(`❌ Error validating component: ${error.message}`);
  }
}

// Process command line arguments
const filePaths = process.argv.slice(2);
if (filePaths.length === 0) {
  console.log('Usage: node validate-component.js <file-path>');
  process.exit(1);
}

filePaths.forEach(validateComponent);