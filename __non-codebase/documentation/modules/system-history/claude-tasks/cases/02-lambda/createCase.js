/**
 * AWS Lambda Function: Create Case
 * Handles case creation with evidence management and multi-tenant isolation
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Configuration
const CASES_TABLE = process.env.CASES_TABLE || 'Situ8_Cases';
const TIMELINE_TABLE = process.env.TIMELINE_TABLE || 'Situ8_CaseTimeline';

/**
 * Lambda handler for creating cases
 */
exports.handler = async (event) => {
  console.log('Create case request:', JSON.stringify(event, null, 2));

  try {
    // Parse request
    const { body, requestContext } = event;
    const caseData = JSON.parse(body);

    // Extract company ID from Cognito JWT claims
    const claims = requestContext.authorizer.claims;
    const companyId = claims['custom:companyId'];
    const userId = claims.sub;
    const userEmail = claims.email;

    if (!companyId || !userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Authentication required - missing company or user ID'
        })
      };
    }

    // Validate required fields
    const validation = validateCaseData(caseData);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Validation failed',
          details: validation.errors
        })
      };
    }

    // Generate case ID and number
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const caseNumber = await generateCaseNumber(companyId);

    // Prepare case record
    const timestamp = new Date().toISOString();
    const caseRecord = {
      id: caseId,
      companyId,
      caseNumber,
      
      // Basic information
      title: caseData.title,
      description: caseData.description,
      caseType: caseData.caseType,
      status: caseData.status || 'draft',
      priority: caseData.priority,
      
      // Creation context
      creationSource: caseData.creationSource || 'manual',
      sourceIncidentId: caseData.sourceIncidentId,
      sourceActivityId: caseData.sourceActivityId,
      
      // Investigation team
      leadInvestigatorId: caseData.leadInvestigatorId,
      investigators: caseData.investigators || [caseData.leadInvestigatorId],
      reviewers: caseData.reviewers || [],
      externalInvestigators: caseData.externalInvestigators || [],
      
      // Multi-site coordination
      primarySiteId: caseData.primarySiteId,
      involvedSites: caseData.involvedSites || [caseData.primarySiteId],
      requiresSiteCoordination: (caseData.involvedSites || []).length > 1,
      
      // Related entities
      relatedActivities: caseData.relatedActivities || [],
      relatedIncidents: caseData.relatedIncidents || [],
      parentCaseId: caseData.parentCaseId,
      childCases: [],
      
      // Evidence management
      evidenceItems: [],
      evidenceCustodyLog: [],
      evidenceSummary: caseData.evidenceSummary,
      
      // Investigation phases\n      currentPhase: caseData.currentPhase || 'initiation',\n      phasesCompleted: [],\n      phaseTimeline: [],\n      \n      // Documentation\n      initialFindings: caseData.initialFindings,\n      investigationPlan: caseData.investigationPlan,\n      interimReports: [],\n      finalReport: null,\n      \n      // Deadlines and scheduling\n      targetCompletionDate: caseData.targetCompletionDate,\n      regulatoryDeadline: caseData.regulatoryDeadline,\n      milestones: caseData.milestones || [],\n      \n      // Approval workflow\n      requiresApproval: caseData.requiresApproval || false,\n      approvalStatus: 'not_required',\n      approvals: [],\n      \n      // Classification\n      sensitivityLevel: caseData.sensitivityLevel || 'internal',\n      caseCategory: caseData.caseCategory || [],\n      tags: caseData.tags || [],\n      \n      // Outcome tracking\n      outcome: null,\n      recommendations: [],\n      correctiveActions: [],\n      \n      // Metrics\n      estimatedHours: caseData.estimatedHours,\n      actualHours: 0,\n      costEstimate: caseData.costEstimate,\n      actualCost: 0,\n      \n      // Communication\n      stakeholderUpdates: [],\n      confidentialityLevel: caseData.confidentialityLevel || 'internal_only',\n      \n      // Timestamps and audit\n      createdAt: timestamp,\n      updatedAt: timestamp,\n      createdBy: userId,\n      updatedBy: userId,\n      \n      // Closure fields (null for new cases)\n      closedAt: null,\n      closedBy: null,\n      closureReason: null,\n      closureSummary: null\n    };\n\n    // Create case in DynamoDB\n    await dynamodb.put({\n      TableName: CASES_TABLE,\n      Item: caseRecord,\n      ConditionExpression: 'attribute_not_exists(id)'\n    }).promise();\n\n    // Create initial timeline entry\n    const timelineEntry = {\n      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,\n      companyId,\n      caseId,\n      timestamp,\n      eventType: 'case_created',\n      phase: 'initiation',\n      title: 'Case Created',\n      description: `Case ${caseNumber} created by ${userEmail}`,\n      userId,\n      userEmail,\n      metadata: {\n        caseType: caseRecord.caseType,\n        priority: caseRecord.priority,\n        leadInvestigator: caseRecord.leadInvestigatorId\n      }\n    };\n\n    await dynamodb.put({\n      TableName: TIMELINE_TABLE,\n      Item: timelineEntry\n    }).promise();\n\n    console.log(`✅ Case created successfully: ${caseId}`);\n\n    return {\n      statusCode: 201,\n      headers: {\n        'Content-Type': 'application/json',\n        'Access-Control-Allow-Origin': '*'\n      },\n      body: JSON.stringify({\n        success: true,\n        data: {\n          case: caseRecord,\n          timeline: [timelineEntry]\n        },\n        message: 'Case created successfully'\n      })\n    };\n\n  } catch (error) {\n    console.error('Error creating case:', error);\n    \n    return {\n      statusCode: 500,\n      headers: {\n        'Content-Type': 'application/json',\n        'Access-Control-Allow-Origin': '*'\n      },\n      body: JSON.stringify({\n        error: 'Internal server error',\n        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'\n      })\n    };\n  }\n};\n\n/**\n * Validate case data\n */\nfunction validateCaseData(data) {\n  const errors = [];\n  \n  // Required fields\n  if (!data.title || data.title.trim().length === 0) {\n    errors.push({ field: 'title', message: 'Title is required' });\n  }\n  \n  if (!data.description || data.description.trim().length === 0) {\n    errors.push({ field: 'description', message: 'Description is required' });\n  }\n  \n  if (!data.caseType) {\n    errors.push({ field: 'caseType', message: 'Case type is required' });\n  }\n  \n  if (!data.priority) {\n    errors.push({ field: 'priority', message: 'Priority is required' });\n  }\n  \n  if (!data.leadInvestigatorId) {\n    errors.push({ field: 'leadInvestigatorId', message: 'Lead investigator is required' });\n  }\n  \n  if (!data.primarySiteId) {\n    errors.push({ field: 'primarySiteId', message: 'Primary site is required' });\n  }\n  \n  // Field length validation\n  if (data.title && data.title.length > 200) {\n    errors.push({ field: 'title', message: 'Title must be 200 characters or less' });\n  }\n  \n  if (data.description && data.description.length > 2000) {\n    errors.push({ field: 'description', message: 'Description must be 2000 characters or less' });\n  }\n  \n  // Enum validation\n  const validCaseTypes = [\n    'security_investigation', 'incident_investigation', 'safety_investigation',\n    'fraud_investigation', 'compliance_investigation', 'property_investigation',\n    'personnel_investigation', 'operational_investigation', 'environmental_investigation',\n    'quality_investigation', 'audit_investigation', 'legal_investigation', 'other'\n  ];\n  \n  if (data.caseType && !validCaseTypes.includes(data.caseType)) {\n    errors.push({ field: 'caseType', message: 'Invalid case type' });\n  }\n  \n  const validPriorities = ['low', 'medium', 'high', 'critical'];\n  if (data.priority && !validPriorities.includes(data.priority)) {\n    errors.push({ field: 'priority', message: 'Invalid priority level' });\n  }\n  \n  const validStatuses = ['draft', 'active', 'pending_review', 'on_hold', 'escalated', 'completed', 'closed', 'archived'];\n  if (data.status && !validStatuses.includes(data.status)) {\n    errors.push({ field: 'status', message: 'Invalid status' });\n  }\n  \n  const validSensitivityLevels = ['public', 'internal', 'confidential', 'restricted', 'classified'];\n  if (data.sensitivityLevel && !validSensitivityLevels.includes(data.sensitivityLevel)) {\n    errors.push({ field: 'sensitivityLevel', message: 'Invalid sensitivity level' });\n  }\n  \n  return {\n    isValid: errors.length === 0,\n    errors\n  };\n}\n\n/**\n * Generate sequential case number for company\n */\nasync function generateCaseNumber(companyId) {\n  try {\n    const currentYear = new Date().getFullYear();\n    const prefix = `CASE-${currentYear}-`;\n    \n    // Query existing cases for this company and year to get next number\n    const result = await dynamodb.query({\n      TableName: CASES_TABLE,\n      IndexName: 'CreatedAtIndex',\n      KeyConditionExpression: 'companyId = :companyId AND begins_with(createdAt, :year)',\n      ExpressionAttributeValues: {\n        ':companyId': companyId,\n        ':year': currentYear.toString()\n      },\n      ProjectionExpression: 'caseNumber'\n    }).promise();\n    \n    // Find highest existing number\n    let maxNumber = 0;\n    result.Items.forEach(item => {\n      if (item.caseNumber && item.caseNumber.startsWith(prefix)) {\n        const numberPart = item.caseNumber.replace(prefix, '');\n        const number = parseInt(numberPart, 10);\n        if (!isNaN(number) && number > maxNumber) {\n          maxNumber = number;\n        }\n      }\n    });\n    \n    // Generate next number with padding\n    const nextNumber = (maxNumber + 1).toString().padStart(6, '0');\n    return `${prefix}${nextNumber}`;\n    \n  } catch (error) {\n    console.error('Error generating case number:', error);\n    // Fallback to timestamp-based number\n    const timestamp = Date.now();\n    return `CASE-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;\n  }\n}"