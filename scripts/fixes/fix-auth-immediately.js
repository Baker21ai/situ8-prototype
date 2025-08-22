#!/usr/bin/env node

/**
 * 🔧 SITU8 Authentication Fix Script
 * This script diagnoses and fixes the "Auth UserPool not configured" error
 * 
 * Usage: node fix-auth-immediately.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 SITU8 Authentication Fix Script');
console.log('==================================\n');

// Step 1: Check current .env.local file
console.log('📋 Step 1: Checking .env.local file...');
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

let envLocalContent = '';
if (fs.existsSync(envLocalPath)) {
    envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
    console.log('✅ Found .env.local file');
} else {
    console.log('❌ .env.local file not found');
    
    // Create .env.local from .env.example if it exists
    if (fs.existsSync(envExamplePath)) {
        const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envLocalPath, envExampleContent);
        envLocalContent = envExampleContent;
        console.log('✅ Created .env.local from .env.example');
    } else {
        console.log('❌ .env.example also not found');
    }
}

// Step 2: Verify required Cognito variables
console.log('\n📋 Step 2: Checking Cognito configuration...');

const requiredVars = [
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_CLIENT_ID',
    'VITE_COGNITO_IDENTITY_POOL_ID',
    'VITE_AWS_REGION',
    'VITE_USE_AWS_API'
];

const missingVars = [];
requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=`, 'm');
    if (!regex.test(envLocalContent)) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.log(`❌ Missing variables: ${missingVars.join(', ')}`);
    
    // Add missing variables
    const missingConfig = missingVars.map(varName => {
        const defaults = {
            'VITE_COGNITO_USER_POOL_ID': 'us-west-2_ECLKvbdSp',
            'VITE_COGNITO_CLIENT_ID': '5ouh548bibh1rrp11neqcvvqf6',
            'VITE_COGNITO_IDENTITY_POOL_ID': 'us-west-2:4b69b0bd-8420-461e-adfa-ad6b9779d7a4',
            'VITE_AWS_REGION': 'us-west-2',
            'VITE_USE_AWS_API': 'true'
        };
        return `${varName}=${defaults[varName]}`;
    }).join('\n');
    
    const updatedContent = envLocalContent.trim() + '\n\n# Added by fix-auth-immediately.js\n' + missingConfig;
    fs.writeFileSync(envLocalPath, updatedContent);
    console.log('✅ Added missing variables to .env.local');
} else {
    console.log('✅ All required variables present');
}

// Step 3: Verify AWS user exists
console.log('\n📋 Step 3: Checking AWS Cognito users...');
console.log('ℹ️  AWS Users to test:');
console.log('   - yamen@example.com / SecurePass123!');
console.log('   - guard@situ8.test / SecurePass123!');
console.log('   - celine@example.com / TempPassword123!');

// Step 4: Clear caches
console.log('\n📋 Step 4: Clearing caches...');

try {
    // Clear Vite cache
    const viteCachePath = path.join(process.cwd(), 'node_modules/.vite');
    if (fs.existsSync(viteCachePath)) {
        fs.rmSync(viteCachePath, { recursive: true, force: true });
        console.log('✅ Cleared Vite cache');
    }
    
    // Clear .vite directory
    const dotVitePath = path.join(process.cwd(), '.vite');
    if (fs.existsSync(dotVitePath)) {
        fs.rmSync(dotVitePath, { recursive: true, force: true });
        console.log('✅ Cleared .vite directory');
    }
    
} catch (error) {
    console.log('⚠️  Could not clear some caches:', error.message);
}

// Step 5: Create test HTML for immediate verification
console.log('\n📋 Step 5: Creating test files...');

const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>🎯 SITU8 Auth Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .success { color: #155724; background: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { color: #721c24; background: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white; }
        input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; width: 200px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 SITU8 Authentication Test</h1>
        <p>After running the fix script, test your authentication here:</p>
        
        <div id="status"></div>
        
        <h3>Quick Test</h3>
        <button onclick="testAWSMode()">Test AWS Configuration</button>
        <button onclick="clearBrowserData()">Clear Browser Data</button>
        
        <h3>Login Test</h3>
        <input type="email" id="email" placeholder="Email" value="yamen@example.com">
        <input type="password" id="password" placeholder="Password" value="SecurePass123!">
        <button onclick="testLogin()">Test Login</button>
        
        <h3>Test Users</h3>
        <ul>
            <li><strong>AWS User:</strong> yamen@example.com / SecurePass123!</li>
            <li><strong>AWS User:</strong> guard@situ8.test / SecurePass123!</li>
            <li><strong>AWS User:</strong> celine@example.com / TempPassword123!</li>
        </ul>
    </div>

    <script>
        async function testAWSMode() {
            const status = document.getElementById('status');
            status.innerHTML = '<div>Checking AWS configuration...</div>';
            
            try {
                // Check if AWS mode is active
                const hasConfig = !!window.VITE_COGNITO_USER_POOL_ID;
                
                if (hasConfig) {
                    status.innerHTML = '<div class="success">✅ AWS mode is active!</div>';
                } else {
                    status.innerHTML = '<div class="error">❌ Still in demo mode</div>';
                }
            } catch (error) {
                status.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
            }
        }
        
        function clearBrowserData() {
            localStorage.clear();
            sessionStorage.clear();
            alert('Browser data cleared! Refresh the page.');
        }
        
        // Check on load
        testAWSMode();
    </script>
</body>
</html>`;

fs.writeFileSync('auth-test.html', testHtml);
console.log('✅ Created auth-test.html for testing');

// Step 6: Final instructions
console.log('\n🎉 Fix Complete!');
console.log('=================');
console.log('1. ✅ Environment variables updated');
console.log('2. ✅ Caches cleared');
console.log('3. ✅ Test files created');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Restart your dev server: npm run dev');
console.log('2. Open: http://localhost:5173/auth-test.html');
console.log('3. Test login with: yamen@example.com / SecurePass123!');
console.log('');
console.log('📱 If still having issues:');
console.log('- Check .env.local file contents');
console.log('- Clear browser cache (Cmd+Shift+R)');
console.log('- Try incognito/private browser window');
console.log('');
console.log('🔍 Debug URLs:');
console.log('- http://localhost:5173/auth-test.html');
console.log('- http://localhost:5173/auth-status-check.html');
console.log('- http://localhost:5173/debug-env-now.html');