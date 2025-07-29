#!/usr/bin/env node

/**
 * Documentation Updater Script
 * Updates project documentation when markdown files change
 */

const fs = require('fs');
const path = require('path');

function updateDocumentation(filePath) {
  console.log(`📚 Processing documentation update: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Generate table of contents for README files
    if (fileName.toLowerCase() === 'readme.md') {
      generateTableOfContents(filePath, content);
    }
    
    // Update component documentation
    if (content.includes('## Components') || content.includes('# Components')) {
      updateComponentDocs(filePath);
    }
    
    // Validate markdown links
    validateMarkdownLinks(filePath, content);
    
    console.log(`✅ Documentation processing complete`);
    
  } catch (error) {
    console.error(`❌ Error processing documentation: ${error.message}`);
  }
}

function generateTableOfContents(filePath, content) {
  const lines = content.split('\n');
  const headers = lines.filter(line => line.startsWith('#'));
  
  if (headers.length > 3) { // Only generate TOC if there are enough headers
    console.log(`📋 Generating table of contents for ${path.basename(filePath)}`);
    
    const toc = headers.map(header => {
      const level = header.match(/^#+/)[0].length;
      const text = header.replace(/^#+\s*/, '');
      const anchor = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      const indent = '  '.repeat(level - 1);
      return `${indent}- [${text}](#${anchor})`;
    }).join('\n');
    
    console.log(`💡 Suggested table of contents:\n${toc}`);
  }
}

function updateComponentDocs(filePath) {
  console.log(`🔧 Checking component documentation structure`);
  
  // This could scan the components directory and ensure all components are documented
  const componentsDir = path.join(process.cwd(), 'components');
  
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir, { recursive: true })
      .filter(file => file.endsWith('.tsx') && !file.includes('.test.'));
    
    console.log(`📊 Found ${componentFiles.length} component files`);
    console.log(`💡 Consider documenting: ${componentFiles.slice(0, 5).join(', ')}${componentFiles.length > 5 ? '...' : ''}`);
  }
}

function validateMarkdownLinks(filePath, content) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [...content.matchAll(linkRegex)];
  
  let brokenLinks = 0;
  
  links.forEach(([fullMatch, text, url]) => {
    if (url.startsWith('./') || url.startsWith('../')) {
      const linkPath = path.resolve(path.dirname(filePath), url);
      if (!fs.existsSync(linkPath)) {
        console.log(`⚠️  Broken relative link: ${text} -> ${url}`);
        brokenLinks++;
      }
    }
  });
  
  if (brokenLinks === 0 && links.length > 0) {
    console.log(`✅ All relative links validated (${links.length} checked)`);
  }
}

// Process command line arguments
const filePaths = process.argv.slice(2);
if (filePaths.length === 0) {
  console.log('Usage: node update-docs.js <file-path>');
  process.exit(1);
}

filePaths.forEach(updateDocumentation);