const fs = require('fs');
const path = require('path');

// Function to fix various syntax issues in a file
function fixSyntaxIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix pattern: useEffect: _useEffect -> useEffect
    content = content.replace(/useEffect:\s*_useEffect/g, 'useEffect');
    if (content !== fs.readFileSync(filePath, 'utf8')) modified = true;

    // Fix pattern: setVar: _setVar -> setVar
    content = content.replace(/(\w+):\s*_\1/g, '$1');
    if (content !== fs.readFileSync(filePath, 'utf8')) modified = true;

    // Fix pattern: var: _var -> var as _var (for function parameters)
    content = content.replace(/(\w+):\s*(_\w+):/g, '$2:');
    if (content !== fs.readFileSync(filePath, 'utf8')) modified = true;

    // Fix pattern: onAction: _onAction, -> _onAction,
    content = content.replace(/(\w+):\s*(_\w+),/g, '$2,');
    if (content !== fs.readFileSync(filePath, 'utf8')) modified = true;

    // Fix pattern: onAction: _onAction } -> _onAction }
    content = content.replace(/(\w+):\s*(_\w+)\s*}/g, '$2 }');
    if (content !== fs.readFileSync(filePath, 'utf8')) modified = true;

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax issues in: ${filePath}`);
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
      if (fixSyntaxIssues(fullPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

// Run the fix
console.log('Fixing remaining syntax issues...');
const fixed = fixAllFiles('.');
console.log(`Fixed syntax issues in ${fixed} files.`);