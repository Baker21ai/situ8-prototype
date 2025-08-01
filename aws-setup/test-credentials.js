#!/usr/bin/env node

/**
 * AWS Credentials Test Script
 * 
 * This script helps diagnose AWS credential issues by:
 * 1. Testing different credential sources
 * 2. Providing detailed error information
 * 3. Suggesting fixes for common problems
 */

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

async function testCredentials() {
    console.log('🔍 Testing AWS Credentials...\n');
    
    // Test 1: Using default credential chain
    console.log('📋 Test 1: Default Credential Chain');
    try {
        const sts = new STSClient({ region: 'us-west-1' });
        const command = new GetCallerIdentityCommand({});
        const result = await sts.send(command);
        
        console.log('✅ SUCCESS! Your credentials are working.');
        console.log('📊 Account Details:');
        console.log(`   - Account ID: ${result.Account}`);
        console.log(`   - User ARN: ${result.Arn}`);
        console.log(`   - User ID: ${result.UserId}`);
        return true;
    } catch (error) {
        console.log('❌ FAILED with default credentials');
        console.log(`   Error: ${error.message}`);
        console.log(`   Error Code: ${error.name}`);
        
        if (error.name === 'SignatureDoesNotMatch') {
            console.log('\n🔧 SIGNATURE MISMATCH TROUBLESHOOTING:');
            console.log('   1. Check your AWS Secret Access Key is correct');
            console.log('   2. Ensure no extra spaces in credentials');
            console.log('   3. Verify your system time is correct');
            console.log('   4. Try regenerating your access keys in AWS Console');
        }
        
        return false;
    }
}

async function showCredentialSources() {
    console.log('\n📍 Credential Sources (in order of precedence):');
    console.log('   1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
    console.log('   2. AWS credentials file (~/.aws/credentials)');
    console.log('   3. AWS config file (~/.aws/config)');
    console.log('   4. IAM roles (if running on EC2)');
    
    console.log('\n🔍 Current Environment:');
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
}

async function main() {
    await showCredentialSources();
    const success = await testCredentials();
    
    if (!success) {
        console.log('\n🚨 NEXT STEPS TO FIX:');
        console.log('   1. Go to AWS Console → IAM → Users → [Your User] → Security credentials');
        console.log('   2. Create new Access Key (delete old one if needed)');
        console.log('   3. Run: aws configure');
        console.log('   4. Enter the NEW credentials carefully');
        console.log('   5. Run this test script again');
        
        process.exit(1);
    } else {
        console.log('\n🎉 Ready to create DynamoDB tables!');
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Test script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { testCredentials, showCredentialSources };