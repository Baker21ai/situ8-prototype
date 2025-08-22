#!/usr/bin/env node

/**
 * SITU8 Development Server - Fresh Start Script
 * This script automatically clears all caches and starts the dev server
 * Usage: node dev-clean.js or npm run dev:clean
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  blue: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`)
};

console.log('🧹 SITU8 Development Server - Fresh Start Script');
console.log('================================================');

// Function to safely remove directories
function safeRemove(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log.info(`Removed: ${dirPath}`);
    }
  } catch (error) {
    log.warn(`Could not remove ${dirPath}: ${error.message}`);
  }
}

// Clear Vite caches
log.info('Clearing Vite development caches...');
safeRemove(path.join(__dirname, 'node_modules/.vite'));
safeRemove(path.join(__dirname, '.vite'));

// Clear build artifacts
log.info('Removing build artifacts...');
safeRemove(path.join(__dirname, 'dist'));

// Clear browser-related caches
log.info('Clearing cache files...');
safeRemove(path.join(__dirname, '.eslintcache'));

// Check environment files
if (fs.existsSync('.env.local')) {
  log.info('.env.local found - environment variables ready');
} else {
  log.warn('.env.local not found - copying from .env.example');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env.local');
    log.info('Created .env.local from .env.example');
  } else {
    log.error('.env.example not found - please create .env.local manually');
  }
}

// Check dependencies
log.info('Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  log.warn('node_modules not found - running npm install...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    log.info('Dependencies installed successfully');
  } catch (error) {
    log.error('Failed to install dependencies');
    process.exit(1);
  }
} else {
  log.info('Dependencies already installed');
}

// Start the development server
log.info('Starting development server with fresh state...');
console.log('');
log.blue('🚀 Starting Vite development server...');
log.blue('📱 Your app will be available at: http://localhost:5173');
log.blue('🧪 Test authentication at: http://localhost:5173/auth-test.html');
console.log('');

// Start Vite
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  log.error('Failed to start development server');
  process.exit(1);
}