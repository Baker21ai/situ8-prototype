#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Auto-fixing unused variable errors...\n');

// Get lint output
let lintOutput;
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('✅ No lint errors found!');
  process.exit(0);
} catch (error) {
  lintOutput = error.stdout.toString();
}

// Parse lint errors
const errors = [];
const lines = lintOutput.split('\n');
let currentFile = '';

for (const line of lines) {
  if (line.startsWith('/')) {
    currentFile = line.trim();
  } else if (line.includes('is defined but never used') || line.includes('is assigned a value but never used')) {
    const match = line.match(/(\d+):(\d+)\s+error\s+'([^']+)'/);
    if (match && currentFile) {
      const [, lineNum, col, varName] = match;
      errors.push({
        file: currentFile,
        line: parseInt(lineNum),
        variable: varName,
        fullLine: line
      });
    }
  }
}

console.log(`Found ${errors.length} unused variable errors to fix...\n`);

// Group errors by file for efficient processing
const fileGroups = {};
errors.forEach(error => {
  if (!fileGroups[error.file]) {
    fileGroups[error.file] = [];
  }
  fileGroups[error.file].push(error);
});

// Process each file
for (const [filePath, fileErrors] of Object.entries(fileGroups)) {
  console.log(`📝 Fixing ${fileErrors.length} errors in ${path.basename(filePath)}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Sort errors by line number (descending) to avoid line number shifts
    fileErrors.sort((a, b) => b.line - a.line);
    
    for (const error of fileErrors) {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const originalLine = lines[lineIndex];
        
        // Different patterns for different types of unused variables
        let newLine = originalLine;
        
        // Pattern 1: Import destructuring { VarName }
        if (originalLine.includes(`{ ${error.variable}`) || originalLine.includes(`, ${error.variable}`)) {
          newLine = originalLine.replace(new RegExp(`\\b${error.variable}\\b`), `${error.variable}: _${error.variable}`);
        }
        // Pattern 2: Function parameters
        else if (originalLine.includes(`${error.variable},`) || originalLine.includes(`${error.variable})`)) {
          newLine = originalLine.replace(new RegExp(`\\b${error.variable}\\b`), `_${error.variable}`);
        }
        // Pattern 3: Variable declarations
        else if (originalLine.includes(`const ${error.variable}`) || originalLine.includes(`let ${error.variable}`) || originalLine.includes(`var ${error.variable}`)) {
          newLine = originalLine.replace(new RegExp(`\\b${error.variable}\\b`), `_${error.variable}`);
        }
        // Pattern 4: Destructuring assignments
        else if (originalLine.includes(`${error.variable} =`) || originalLine.includes(`${error.variable},`)) {
          newLine = originalLine.replace(new RegExp(`\\b${error.variable}\\b`), `_${error.variable}`);
        }
        
        if (newLine !== originalLine) {
          lines[lineIndex] = newLine;
          console.log(`  ✓ Line ${error.line}: ${error.variable} → _${error.variable}`);
        }
      }
    }
    
    // Write the modified content back
    fs.writeFileSync(filePath, lines.join('\n'));
    
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
  }
}

console.log('\n🧪 Running lint again to verify fixes...\n');

// Run lint again to check results
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('\n✅ All unused variable errors have been fixed!');
} catch (error) {
  console.log('\n⚠️  Some errors may remain. Check the output above.');
}