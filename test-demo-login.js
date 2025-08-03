#!/usr/bin/env node

/**
 * Test script for demo login functionality
 * This script tests the authentication flow for all demo users
 */

const puppeteer = require('puppeteer');

async function testDemoLogin() {
  console.log('🧪 Starting Demo Login Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    defaultViewport: { width: 1280, height: 800 }
  });

  const demoUsers = [
    { button: 'Admin Access', id: 'demo-admin-001', expectedRole: 'Admin' },
    { button: 'Security Officer Access', id: 'demo-guard-001', expectedRole: 'Security Officer' },
    { button: 'Developer Access', id: 'demo-dev-001', expectedRole: 'Developer' }
  ];

  let allTestsPassed = true;

  for (const user of demoUsers) {
    console.log(`\n📝 Testing ${user.button}...`);
    
    try {
      const page = await browser.newPage();
      
      // Enable console logging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error('Browser Error:', msg.text());
        }
      });

      // Navigate to the app
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
      console.log('✓ Page loaded');

      // Wait for login form
      await page.waitForSelector('text/Quick Access', { timeout: 5000 });
      console.log('✓ Login form visible');

      // Click the demo user button
      const buttonSelector = `button:has-text("${user.button}")`;
      await page.waitForSelector(buttonSelector, { timeout: 5000 });
      await page.click(buttonSelector);
      console.log(`✓ Clicked ${user.button} button`);

      // Wait for navigation or error
      try {
        // Check if we're redirected to the main app
        await page.waitForFunction(
          () => window.location.pathname !== '/' || document.querySelector('[data-error]'),
          { timeout: 5000 }
        );

        // Check if we're authenticated
        const isAuthenticated = await page.evaluate(() => {
          // Check localStorage or session
          const authData = localStorage.getItem('situ8-auth-storage');
          if (authData) {
            const parsed = JSON.parse(authData);
            return parsed.state?.isAuthenticated === true;
          }
          return false;
        });

        if (isAuthenticated) {
          console.log('✅ Login successful - User authenticated');
          
          // Verify we're on the command center
          const url = page.url();
          if (url.includes('command-center') || url !== 'http://localhost:5173/') {
            console.log('✅ Redirected to main application');
          }

          // Check for footer with RadioTray
          const hasFooter = await page.$('footer') !== null;
          if (hasFooter) {
            console.log('✅ Footer with RadioTray is visible');
          }
        } else {
          console.error('❌ Login failed - User not authenticated');
          allTestsPassed = false;
        }

      } catch (navError) {
        // Check for error messages
        const errorText = await page.$eval('[data-error], .text-destructive', el => el.textContent).catch(() => null);
        if (errorText) {
          console.error('❌ Login error:', errorText);
          allTestsPassed = false;
        } else {
          console.error('❌ Login timeout - no navigation occurred');
          allTestsPassed = false;
        }
      }

      await page.close();
      
    } catch (error) {
      console.error(`❌ Test failed for ${user.button}:`, error.message);
      allTestsPassed = false;
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All demo login tests PASSED!');
  } else {
    console.log('❌ Some tests FAILED. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
testDemoLogin().catch(console.error);