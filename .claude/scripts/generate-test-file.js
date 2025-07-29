#!/usr/bin/env node

/**
 * Test File Generator Script
 * Automatically generates test files for new React components
 */

const fs = require('fs');
const path = require('path');

function generateTestFile(componentPath) {
  const componentName = path.basename(componentPath, '.tsx');
  const componentDir = path.dirname(componentPath);
  const testPath = path.join(componentDir, `${componentName}.test.tsx`);
  
  // Check if test file already exists
  if (fs.existsSync(testPath)) {
    console.log(`⏭️  Test file already exists: ${testPath}`);
    return;
  }
  
  const testTemplate = `import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
  });

  it('displays expected content', () => {
    render(<${componentName} />);
    // Add your specific test assertions here
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('handles user interactions correctly', () => {
    render(<${componentName} />);
    // Add interaction tests here
  });

  it('meets accessibility requirements', () => {
    render(<${componentName} />);
    // Add accessibility tests here
  });
});
`;

  try {
    fs.writeFileSync(testPath, testTemplate);
    console.log(`✅ Generated test file: ${testPath}`);
  } catch (error) {
    console.error(`❌ Error generating test file: ${error.message}`);
  }
}

// Process command line arguments
const filePaths = process.argv.slice(2);
if (filePaths.length === 0) {
  console.log('Usage: node generate-test-file.js <component-path>');
  process.exit(1);
}

filePaths.forEach(generateTestFile);