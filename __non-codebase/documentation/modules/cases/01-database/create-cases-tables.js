/**
 * DynamoDB Table Creation Script for Cases Module
 * Creates and configures all necessary tables for case management with multi-tenant support
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

// Configuration
const REGION = 'us-west-2';
const TABLE_PREFIX = 'Situ8_';

// Configure AWS SDK
AWS.config.update({ region: REGION });

/**
 * Cases table configuration
 * Multi-tenant with companyId as range key
 */
const casesTableConfig = {
  TableName: `${TABLE_PREFIX}Cases`,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'companyId', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'leadInvestigatorId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
    { AttributeName: 'priority', AttributeType: 'S' },
    { AttributeName: 'caseType', AttributeType: 'S' },
    { AttributeName: 'primarySiteId', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' },
    { AttributeName: 'companyId', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CompanyStatusIndex',
      KeySchema: [
        { AttributeName: 'companyId', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'InvestigatorIndex',
      KeySchema: [
        { AttributeName: 'leadInvestigatorId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
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
        { AttributeName: 'companyId', KeyType: 'HASH' },
        { AttributeName: 'priority', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'TypeSiteIndex',
      KeySchema: [
        { AttributeName: 'caseType', KeyType: 'HASH' },
        { AttributeName: 'primarySiteId', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'CreatedAtIndex',
      KeySchema: [
        { AttributeName: 'companyId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10
  },
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES'
  }
};

/**
 * Evidence Items table configuration
 * Stores case evidence with chain of custody
 */
const evidenceTableConfig = {
  TableName: `${TABLE_PREFIX}CaseEvidence`,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'companyId', AttributeType: 'S' },
    { AttributeName: 'caseId', AttributeType: 'S' },
    { AttributeName: 'collectedAt', AttributeType: 'S' },
    { AttributeName: 'evidenceType', AttributeType: 'S' },
    { AttributeName: 'currentCustodian', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' },
    { AttributeName: 'companyId', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CaseEvidenceIndex',
      KeySchema: [
        { AttributeName: 'caseId', KeyType: 'HASH' },
        { AttributeName: 'collectedAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'EvidenceTypeIndex',
      KeySchema: [
        { AttributeName: 'evidenceType', KeyType: 'HASH' },
        { AttributeName: 'collectedAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'CustodianIndex',
      KeySchema: [
        { AttributeName: 'currentCustodian', KeyType: 'HASH' },
        { AttributeName: 'collectedAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10
  }
};

/**
 * Chain of Custody table configuration
 * Tracks evidence transfers and custody history
 */
const custodyTableConfig = {
  TableName: `${TABLE_PREFIX}CustodyLog`,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'companyId', AttributeType: 'S' },
    { AttributeName: 'evidenceId', AttributeType: 'S' },
    { AttributeName: 'transferredAt', AttributeType: 'S' },
    { AttributeName: 'transferredFrom', AttributeType: 'S' },
    { AttributeName: 'transferredTo', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' },
    { AttributeName: 'companyId', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'EvidenceCustodyIndex',
      KeySchema: [
        { AttributeName: 'evidenceId', KeyType: 'HASH' },
        { AttributeName: 'transferredAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'TransferFromIndex',
      KeySchema: [
        { AttributeName: 'transferredFrom', KeyType: 'HASH' },
        { AttributeName: 'transferredAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'TransferToIndex',
      KeySchema: [
        { AttributeName: 'transferredTo', KeyType: 'HASH' },
        { AttributeName: 'transferredAt', KeyType: 'RANGE' }
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
};

/**
 * Case Timeline table configuration
 * Tracks investigation phases and milestones
 */
const timelineTableConfig = {
  TableName: `${TABLE_PREFIX}CaseTimeline`,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'companyId', AttributeType: 'S' },
    { AttributeName: 'caseId', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'S' },
    { AttributeName: 'eventType', AttributeType: 'S' }
  ],
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' },
    { AttributeName: 'companyId', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'CaseTimelineIndex',
      KeySchema: [
        { AttributeName: 'caseId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'EventTypeIndex',
      KeySchema: [
        { AttributeName: 'eventType', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
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
};

/**
 * Create all tables
 */
async function createCasesTables() {
  const tables = [
    { name: 'Cases', config: casesTableConfig },
    { name: 'CaseEvidence', config: evidenceTableConfig },
    { name: 'CustodyLog', config: custodyTableConfig },
    { name: 'CaseTimeline', config: timelineTableConfig }
  ];

  console.log('🚀 Creating Cases module DynamoDB tables...\n');

  for (const table of tables) {
    try {
      console.log(`Creating ${table.name} table...`);
      
      const result = await dynamodb.createTable(table.config).promise();
      console.log(`✅ ${table.name} table created successfully`);
      console.log(`   ARN: ${result.TableDescription.TableArn}`);
      
      // Wait for table to be active
      console.log(`   Waiting for ${table.name} to become active...`);
      await dynamodb.waitFor('tableExists', { TableName: table.config.TableName }).promise();
      console.log(`   ✅ ${table.name} is now active\n`);
      
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`⚠️  ${table.name} table already exists, skipping...\n`);
      } else {
        console.error(`❌ Error creating ${table.name} table:`, error.message);
        throw error;
      }
    }
  }

  console.log('🎉 All Cases module tables created successfully!');
  console.log('\nTable Summary:');
  console.log('- Situ8_Cases: Main cases table with investigation details');
  console.log('- Situ8_CaseEvidence: Evidence items with chain of custody');
  console.log('- Situ8_CustodyLog: Custody transfer tracking');
  console.log('- Situ8_CaseTimeline: Investigation timeline and milestones');
  console.log('\nNext steps:');
  console.log('1. Deploy Lambda functions for case operations');
  console.log('2. Configure API Gateway endpoints');
  console.log('3. Test multi-tenant data isolation');
}

/**
 * Generate sample data for testing
 */
async function createSampleData() {
  const docClient = new AWS.DynamoDB.DocumentClient();
  
  console.log('📝 Creating sample case data...\n');

  // Sample cases
  const sampleCases = [
    {
      id: 'case_' + Date.now() + '_001',
      companyId: 'comp_demo_001',
      caseNumber: 'CASE-2025-001',
      title: 'Security Breach Investigation - North Wing',
      description: 'Unauthorized access detected in north wing server room',
      caseType: 'security_investigation',
      status: 'active',
      priority: 'high',
      creationSource: 'incident',
      sourceIncidentId: 'inc_demo_001',
      leadInvestigatorId: 'user_investigator_001',
      investigators: ['user_investigator_001', 'user_officer_002'],
      primarySiteId: 'site_001',
      involvedSites: ['site_001'],
      requiresSiteCoordination: false,
      currentPhase: 'evidence_collection',
      phasesCompleted: ['initiation'],
      sensitivityLevel: 'confidential',
      caseCategory: ['security', 'breach'],
      tags: ['urgent', 'server-room', 'unauthorized-access'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user_admin_001',
      updatedBy: 'user_admin_001'
    },
    {
      id: 'case_' + Date.now() + '_002',
      companyId: 'comp_demo_001',
      caseNumber: 'CASE-2025-002',
      title: 'Workplace Safety Incident - Loading Dock',
      description: 'Employee injury during equipment operation',
      caseType: 'safety_investigation',
      status: 'pending_review',
      priority: 'medium',
      creationSource: 'activity',
      sourceActivityId: 'act_demo_002',
      leadInvestigatorId: 'user_investigator_002',
      investigators: ['user_investigator_002'],
      primarySiteId: 'site_002',
      involvedSites: ['site_002'],
      requiresSiteCoordination: false,
      currentPhase: 'analysis',
      phasesCompleted: ['initiation', 'evidence_collection'],
      sensitivityLevel: 'internal',
      caseCategory: ['safety', 'injury'],
      tags: ['loading-dock', 'equipment', 'injury'],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
      createdBy: 'user_supervisor_001',
      updatedBy: 'user_investigator_002'
    }
  ];

  // Insert sample cases
  for (const caseData of sampleCases) {
    try {
      await docClient.put({
        TableName: `${TABLE_PREFIX}Cases`,
        Item: caseData
      }).promise();
      console.log(`✅ Created sample case: ${caseData.title}`);
    } catch (error) {
      console.error(`❌ Error creating case ${caseData.caseNumber}:`, error.message);
    }
  }

  console.log('\n🎉 Sample data created successfully!');
}

/**
 * Cleanup function to delete all tables
 */
async function deleteCasesTables() {
  const tableNames = [
    `${TABLE_PREFIX}Cases`,
    `${TABLE_PREFIX}CaseEvidence`,
    `${TABLE_PREFIX}CustodyLog`,
    `${TABLE_PREFIX}CaseTimeline`
  ];

  console.log('🗑️  Deleting Cases module tables...\n');

  for (const tableName of tableNames) {
    try {
      console.log(`Deleting ${tableName}...`);
      await dynamodb.deleteTable({ TableName: tableName }).promise();
      console.log(`✅ ${tableName} deleted successfully`);
      
      // Wait for table to be deleted
      await dynamodb.waitFor('tableNotExists', { TableName: tableName }).promise();
      console.log(`   ✅ ${tableName} deletion confirmed\n`);
      
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        console.log(`⚠️  ${tableName} does not exist, skipping...\n`);
      } else {
        console.error(`❌ Error deleting ${tableName}:`, error.message);
      }
    }
  }

  console.log('🎉 All Cases module tables deleted!');
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'create':
    createCasesTables()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Failed to create tables:', error);
        process.exit(1);
      });
    break;

  case 'sample':
    createSampleData()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Failed to create sample data:', error);
        process.exit(1);
      });
    break;

  case 'delete':
    deleteCasesTables()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Failed to delete tables:', error);
        process.exit(1);
      });
    break;

  default:
    console.log('Usage: node create-cases-tables.js [create|sample|delete]');
    console.log('');
    console.log('Commands:');
    console.log('  create  - Create all Cases module DynamoDB tables');
    console.log('  sample  - Create sample data for testing');
    console.log('  delete  - Delete all Cases module tables (use with caution)');
    process.exit(1);
}

module.exports = {
  createCasesTables,
  createSampleData,
  deleteCasesTables,
  casesTableConfig,
  evidenceTableConfig,
  custodyTableConfig,
  timelineTableConfig
};