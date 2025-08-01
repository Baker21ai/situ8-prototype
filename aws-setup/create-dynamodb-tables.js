#!/usr/bin/env node

/**
 * AWS DynamoDB Table Creation Script
 * 
 * TECHNICAL EXPLANATION FOR BEGINNERS:
 * =====================================
 * 
 * 1. DynamoDB is a NoSQL database (no fixed schema like traditional SQL databases)
 * 2. Each table needs a Primary Key (unique identifier for each record)
 * 3. We use GSI (Global Secondary Index) for different query patterns
 * 4. Provisioned throughput controls read/write capacity (we start small)
 * 
 * WHAT THIS SCRIPT DOES:
 * ======================
 * - Creates 5 tables based on your current Zustand stores
 * - Sets up indexes for efficient querying (like database indexes)
 * - Configures proper permissions and billing
 * 
 * WHY WE NEED INDEXES:
 * ===================
 * Think of indexes like a book's table of contents - they help find data quickly
 * Without indexes, DynamoDB would scan every record (slow and expensive)
 * With indexes, it jumps directly to the data you need (fast and cheap)
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client with your region
const dynamodb = new DynamoDBClient({
    region: 'us-west-1' // Your configured region
});

// Table configurations based on your current Zustand stores
const tableConfigurations = [
    {
        TableName: 'Situ8_Activities',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' } // Primary key (like a unique ID card)
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },           // String
            { AttributeName: 'timestamp', AttributeType: 'S' },     // String (ISO date)
            { AttributeName: 'type', AttributeType: 'S' },         // String
            { AttributeName: 'status', AttributeType: 'S' },       // String
            { AttributeName: 'assignedTo', AttributeType: 'S' },   // String
            { AttributeName: 'priority', AttributeType: 'S' }      // String
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'TimestampIndex',
                KeySchema: [
                    { AttributeName: 'timestamp', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'TypeStatusIndex',
                KeySchema: [
                    { AttributeName: 'type', KeyType: 'HASH' },
                    { AttributeName: 'status', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'AssignedToIndex',
                KeySchema: [
                    { AttributeName: 'assignedTo', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'PriorityIndex',
                KeySchema: [
                    { AttributeName: 'priority', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'Situ8_Cases',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' },
            { AttributeName: 'priority', AttributeType: 'S' },
            { AttributeName: 'assignedTo', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'StatusIndex',
                KeySchema: [
                    { AttributeName: 'status', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'PriorityIndex',
                KeySchema: [
                    { AttributeName: 'priority', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'AssignedToIndex',
                KeySchema: [
                    { AttributeName: 'assignedTo', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'Situ8_BOL',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'facility', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' },
            { AttributeName: 'shipmentDate', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'FacilityIndex',
                KeySchema: [
                    { AttributeName: 'facility', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'StatusIndex',
                KeySchema: [
                    { AttributeName: 'status', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'Situ8_Incidents',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'priority', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'PriorityStatusIndex',
                KeySchema: [
                    { AttributeName: 'priority', KeyType: 'HASH' },
                    { AttributeName: 'status', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'TimestampIndex',
                KeySchema: [
                    { AttributeName: 'timestamp', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'Situ8_Audit',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'action', AttributeType: 'S' },
            { AttributeName: 'entityType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'UserActionIndex',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                    { AttributeName: 'action', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'TimestampIndex',
                KeySchema: [
                    { AttributeName: 'timestamp', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'EntityTypeIndex',
                KeySchema: [
                    { AttributeName: 'entityType', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    }
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
async function createAllTables() {
    console.log('🚀 Starting DynamoDB table creation for Situ8 Security Platform...\n');
    console.log('📊 This will create 5 tables based on your current Zustand stores:\n');
    
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
    
    console.log('🎉 DynamoDB setup complete!\n');
    
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
    
    console.log('📋 Summary of all tables:');
    for (const config of tableConfigurations) {
        const tableInfo = await describeTable(config.TableName);
        if (tableInfo) {
            console.log(`   - ${config.TableName}: ${tableInfo.TableStatus} (${tableInfo.ItemCount || 0} items)`);
        }
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Tables are ready for data');
    console.log('   2. Next: Create Lambda functions');
    console.log('   3. Then: Set up API Gateway');
    console.log('   4. Finally: Connect your React app');
}

// Run the script if called directly
if (require.main === module) {
    createAllTables().catch(error => {
        console.error('💥 Script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { 
    createAllTables, 
    tableConfigurations,
    createTable,
    waitForTableActive,
    describeTable
};