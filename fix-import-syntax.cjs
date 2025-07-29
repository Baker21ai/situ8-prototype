const fs = require('fs');
const path = require('path');

// Function to fix import syntax in a file
function fixImportSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix pattern: _VariableName, -> VariableName as _VariableName,
    content = content.replace(/(\s+)_([A-Z][a-zA-Z]*),/g, (match, whitespace, varName) => {
      modified = true;
      return `${whitespace}${varName} as _${varName},`;
    });

    // Fix pattern: _VariableName } -> VariableName as _VariableName }
    content = content.replace(/(\s+)_([A-Z][a-zA-Z]*)\s*}/g, (match, whitespace, varName) => {
      modified = true;
      return `${whitespace}${varName} as _${varName} }`;
    });

    // Fix pattern: { _VariableName -> { VariableName as _VariableName
    content = content.replace(/{\s*_([A-Z][a-zA-Z]*)/g, (match, varName) => {
      modified = true;
      return `{ ${varName} as _${varName}`;
    });

    // Fix pattern: import { _VariableName -> import { VariableName as _VariableName
    content = content.replace(/import\s*{\s*_([A-Z][a-zA-Z]*)/g, (match, varName) => {
      modified = true;
      return `import { ${varName} as _${varName}`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed import syntax in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and fix files
function fixAllFiles(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      totalFixed += fixAllFiles(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImportSyntax(fullPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

// Run the fix
console.log('Fixing import syntax errors...');
const fixed = fixAllFiles('.');
console.log(`Fixed import syntax in ${fixed} files.`);