#!/usr/bin/env node

/**
 * Commit Message Suggestion Script
 * Suggests meaningful commit messages based on file changes
 */

const fs = require('fs');
const path = require('path');

function suggestCommitMessage(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const fileDir = path.dirname(filePath);
  
  let category = 'feat';
  let scope = '';
  let description = '';
  
  // Determine scope based on file location
  if (fileDir.includes('components')) {
    scope = 'components';
  } else if (fileDir.includes('hooks')) {
    scope = 'hooks';
  } else if (fileDir.includes('lib')) {
    scope = 'lib';
  } else if (fileDir.includes('styles')) {
    scope = 'styles';
  }
  
  // Determine category and description based on file type and content
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (filePath.includes('.test.')) {
      category = 'test';
      description = `add tests for ${fileName}`;
    } else if (filePath.includes('README') || filePath.includes('.md')) {
      category = 'docs';
      description = `update documentation for ${fileName}`;
    } else if (content.includes('useState') || content.includes('useEffect')) {
      category = 'feat';
      description = `add ${fileName} component with hooks`;
    } else if (content.includes('interface ') || content.includes('type ')) {
      category = 'feat';
      description = `add ${fileName} types and interfaces`;
    } else {
      category = 'feat';
      description = `add ${fileName} implementation`;
    }
    
  } catch (error) {
    description = `update ${fileName}`;
  }
  
  const commitMessage = scope 
    ? `${category}(${scope}): ${description}`
    : `${category}: ${description}`;
  
  console.log(`💡 Suggested commit message:`);
  console.log(`   ${commitMessage}`);
  console.log(`   
   Alternative formats:
   - Short: ${category}: ${description}
   - Detailed: ${commitMessage}
   
   To use: git commit -m "${commitMessage}"`);
}

// Process command line arguments
const filePaths = process.argv.slice(2);
if (filePaths.length === 0) {
  console.log('Usage: node suggest-commit-message.js <file-path>');
  process.exit(1);
}

filePaths.forEach(suggestCommitMessage);