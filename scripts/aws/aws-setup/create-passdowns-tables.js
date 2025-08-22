#!/usr/bin/env node

/**
 * Create DynamoDB Tables for Passdowns Module
 * 
 * This script creates the necessary tables for the Passdowns shift communication system
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
const { passdownsTableConfig, passdownReceiptsTableConfig, passdownAttachmentsTableConfig } = require('../claude-tasks/passdowns/01-database/dynamodb-table-config');

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-west-2'
});

// Array of table configurations
const tableConfigurations = [
    passdownsTableConfig,
    passdownReceiptsTableConfig,
    passdownAttachmentsTableConfig
];

// Function to create a single table
async function createTable(tableConfig) {
    try {
        console.log(`🔨 Creating table: ${tableConfig.TableName}...`);
        
        const command = new CreateTableCommand(tableConfig);
        const result = await dynamodb.send(command);
        
        console.log(`✅ Table ${tableConfig.TableName} creation initiated!`);
        return result;
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log(`⚠️  Table ${tableConfig.TableName} already exists`);
            return null;
        } else {
            console.error(`❌ Error creating table ${tableConfig.TableName}:`, error.message);
            throw error;
        }
    }
}

// Function to wait for table to be active
async function waitForTableActive(tableName) {
    try {
        console.log(`⏳ Waiting for table ${tableName} to become active...`);
        
        await waitUntilTableExists(
            { client: dynamodb, maxWaitTime: 300 }, // 5 minutes max
            { TableName: tableName }
        );
        
        console.log(`✅ Table ${tableName} is now active and ready to use!`);
    } catch (error) {
        console.error(`❌ Error waiting for table ${tableName}:`, error.message);
        throw error;
    }
}

// Function to describe table (get info about it)
async function describeTable(tableName) {
    try {
        const command = new DescribeTableCommand({ TableName: tableName });
        const result = await dynamodb.send(command);
        return result.Table;
    } catch (error) {
        console.error(`Error describing table ${tableName}:`, error.message);
        return null;
    }
}

// Main function to create all tables
async function createPassdownsTables() {
    console.log('🚀 Starting DynamoDB table creation for Passdowns Module...\n');
    console.log('📊 This will create 3 tables for shift communication:\n');
    console.log('   - Situ8_Passdowns: Main passdown documents');
    console.log('   - Situ8_PassdownReceipts: Read acknowledgments');
    console.log('   - Situ8_PassdownAttachments: File metadata\n');
    
    const createdTables = [];
    const existingTables = [];
    
    for (const tableConfig of tableConfigurations) {
        try {
            const result = await createTable(tableConfig);
            
            if (result) {
                // Table was created, wait for it to be active
                await waitForTableActive(tableConfig.TableName);
                createdTables.push(tableConfig.TableName);
            } else {
                // Table already exists
                existingTables.push(tableConfig.TableName);
            }
            
            console.log(''); // Empty line for readability
        } catch (error) {
            console.error(`💥 Failed to create table ${tableConfig.TableName}:`, error.message);
            console.log('🛑 Stopping table creation process...');
            process.exit(1);
        }
    }
    
    console.log('🎉 Passdowns table setup complete!\n');
    
    if (createdTables.length > 0) {
        console.log('✨ Newly created tables:');
        createdTables.forEach(table => console.log(`   - ${table}`));
        console.log('');
    }
    
    if (existingTables.length > 0) {
        console.log('♻️  Tables that already existed:');
        existingTables.forEach(table => console.log(`   - ${table}`));
        console.log('');
    }
    
    console.log('📋 Summary of all Passdowns tables:');
    for (const config of tableConfigurations) {
        const tableInfo = await describeTable(config.TableName);
        if (tableInfo) {
            console.log(`   - ${config.TableName}: ${tableInfo.TableStatus} (${tableInfo.ItemCount || 0} items)`);
        }
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Create Lambda functions for Passdowns CRUD');
    console.log('   2. Set up API Gateway endpoints');
    console.log('   3. Configure IAM roles and policies');
    console.log('   4. Implement frontend components');
    console.log('\n💡 Tip: Run "npm run deploy-lambdas" next to deploy the Lambda functions');
}

// Run the script if called directly
if (require.main === module) {
    createPassdownsTables().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { 
    createPassdownsTables,
    tableConfigurations
};