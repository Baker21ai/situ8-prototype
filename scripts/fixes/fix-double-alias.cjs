const fs = require('fs');
const path = require('path');

// Function to fix double alias syntax in a file
function fixDoubleAlias(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix pattern: VariableName: VariableName as _VariableName -> VariableName as _VariableName
    content = content.replace(/(\w+):\s*\1\s+as\s+(_\w+)/g, (match, varName, alias) => {
      modified = true;
      return `${varName} as ${alias}`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed double alias syntax in: ${filePath}`);
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
      if (fixDoubleAlias(fullPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

// Run the fix
console.log('Fixing double alias syntax errors...');
const fixed = fixAllFiles('.');
console.log(`Fixed double alias syntax in ${fixed} files.`);