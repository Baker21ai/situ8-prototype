#!/usr/bin/env node

/**
 * Component Index Updater Script
 * Automatically updates index.ts files when new components are created
 */

const fs = require('fs');
const path = require('path');

function updateComponentIndex(componentPath) {
  const componentName = path.basename(componentPath, '.tsx');
  const componentDir = path.dirname(componentPath);
  const indexPath = path.join(componentDir, 'index.ts');
  
  console.log(`📝 Updating component index for: ${componentName}`);
  
  try {
    let indexContent = '';
    
    // Read existing index file if it exists
    if (fs.existsSync(indexPath)) {
      indexContent = fs.readFileSync(indexPath, 'utf8');
    }
    
    // Check if export already exists
    const exportLine = `export { default as ${componentName} } from './${componentName}';`;
    const defaultExportLine = `export { default } from './${componentName}';`;
    
    if (indexContent.includes(exportLine) || indexContent.includes(defaultExportLine)) {
      console.log(`⏭️  Export already exists in index file`);
      return;
    }
    
    // Add the new export
    const newExport = `export { default as ${componentName} } from './${componentName}';\n`;
    
    // Sort exports alphabetically
    const lines = indexContent.split('\n').filter(line => line.trim());
    lines.push(newExport.trim());
    lines.sort();
    
    const updatedContent = lines.join('\n') + '\n';
    
    fs.writeFileSync(indexPath, updatedContent);
    console.log(`✅ Updated component index: ${indexPath}`);
    
  } catch (error) {
    console.error(`❌ Error updating component index: ${error.message}`);
  }
}

// Process command line arguments
const filePaths = process.argv.slice(2);
if (filePaths.length === 0) {
  console.log('Usage: node update-component-index.js <component-path>');
  process.exit(1);
}

filePaths.forEach(updateComponentIndex);