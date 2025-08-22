/**
 * AWS Lambda Function: Get Case by ID
 * Retrieves detailed case information with timeline, evidence, and related entities
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Configuration
const CASES_TABLE = process.env.CASES_TABLE || 'Situ8_Cases';
const EVIDENCE_TABLE = process.env.EVIDENCE_TABLE || 'Situ8_CaseEvidence';
const TIMELINE_TABLE = process.env.TIMELINE_TABLE || 'Situ8_CaseTimeline';
const CUSTODY_TABLE = process.env.CUSTODY_TABLE || 'Situ8_CustodyLog';

/**
 * Lambda handler for retrieving a specific case
 */
exports.handler = async (event) => {
  console.log('Get case by ID request:', JSON.stringify(event, null, 2));

  try {
    // Parse request
    const { pathParameters, queryStringParameters, requestContext } = event;
    const { caseId } = pathParameters;

    // Extract company ID from Cognito JWT claims
    const claims = requestContext.authorizer.claims;
    const companyId = claims['custom:companyId'];
    const userId = claims.sub;

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

    if (!caseId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Case ID is required'
        })
      };
    }

    // Parse query parameters
    const queryParams = queryStringParameters || {};
    const {
      includeEvidence = 'true',
      includeTimeline = 'true',
      includeCustody = 'false',
      includeRelated = 'false'
    } = queryParams;

    // Get case record
    const caseResult = await dynamodb.get({
      TableName: CASES_TABLE,
      Key: { id: caseId, companyId }
    }).promise();

    if (!caseResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',\n          'Access-Control-Allow-Origin': '*'\n        },\n        body: JSON.stringify({\n          error: 'Case not found'\n        })\n      };\n    }\n\n    const caseData = caseResult.Item;\n\n    // Verify user has access to this case\n    const hasAccess = await verifyCaseAccess(caseData, userId, companyId);\n    if (!hasAccess) {\n      return {\n        statusCode: 403,\n        headers: {\n          'Content-Type': 'application/json',\n          'Access-Control-Allow-Origin': '*'\n        },\n        body: JSON.stringify({\n          error: 'Access denied - insufficient permissions for this case'\n        })\n      };\n    }\n\n    // Prepare response data\n    const responseData = {\n      case: caseData\n    };\n\n    // Include evidence if requested\n    if (includeEvidence === 'true') {\n      try {\n        const evidenceResult = await dynamodb.query({\n          TableName: EVIDENCE_TABLE,\n          IndexName: 'CaseEvidenceIndex',\n          KeyConditionExpression: 'caseId = :caseId',\n          ExpressionAttributeValues: {\n            ':caseId': caseId\n          }\n        }).promise();\n        \n        responseData.evidence = evidenceResult.Items.filter(item => item.companyId === companyId);\n      } catch (error) {\n        console.error('Error fetching evidence:', error);\n        responseData.evidence = [];\n      }\n    }\n\n    // Include timeline if requested\n    if (includeTimeline === 'true') {\n      try {\n        const timelineResult = await dynamodb.query({\n          TableName: TIMELINE_TABLE,\n          IndexName: 'CaseTimelineIndex',\n          KeyConditionExpression: 'caseId = :caseId',\n          ExpressionAttributeValues: {\n            ':caseId': caseId\n          },\n          ScanIndexForward: false // Latest first\n        }).promise();\n        \n        responseData.timeline = timelineResult.Items.filter(item => item.companyId === companyId);\n      } catch (error) {\n        console.error('Error fetching timeline:', error);\n        responseData.timeline = [];\n      }\n    }\n\n    // Include custody log if requested\n    if (includeCustody === 'true' && responseData.evidence) {\n      try {\n        const evidenceIds = responseData.evidence.map(e => e.id);\n        \n        if (evidenceIds.length > 0) {\n          // Get custody logs for all evidence items\n          const custodyPromises = evidenceIds.map(evidenceId => \n            dynamodb.query({\n              TableName: CUSTODY_TABLE,\n              IndexName: 'EvidenceCustodyIndex',\n              KeyConditionExpression: 'evidenceId = :evidenceId',\n              ExpressionAttributeValues: {\n                ':evidenceId': evidenceId\n              }\n            }).promise()\n          );\n          \n          const custodyResults = await Promise.all(custodyPromises);\n          const custodyLog = [];\n          \n          custodyResults.forEach(result => {\n            custodyLog.push(...result.Items.filter(item => item.companyId === companyId));\n          });\n          \n          responseData.custodyLog = custodyLog;\n        } else {\n          responseData.custodyLog = [];\n        }\n      } catch (error) {\n        console.error('Error fetching custody log:', error);\n        responseData.custodyLog = [];\n      }\n    }\n\n    // Include related entities if requested\n    if (includeRelated === 'true') {\n      responseData.related = {\n        activities: [],\n        incidents: [],\n        cases: []\n      };\n\n      // TODO: Query related activities, incidents, and cases\n      // This would require additional tables or cross-module queries\n      try {\n        // Get related activities\n        if (caseData.relatedActivities && caseData.relatedActivities.length > 0) {\n          // Would query Activities table\n          responseData.related.activities = caseData.relatedActivities;\n        }\n        \n        // Get related incidents\n        if (caseData.relatedIncidents && caseData.relatedIncidents.length > 0) {\n          // Would query Incidents table\n          responseData.related.incidents = caseData.relatedIncidents;\n        }\n        \n        // Get child cases\n        if (caseData.childCases && caseData.childCases.length > 0) {\n          const childCasePromises = caseData.childCases.map(childId =>\n            dynamodb.get({\n              TableName: CASES_TABLE,\n              Key: { id: childId, companyId }\n            }).promise()\n          );\n          \n          const childResults = await Promise.all(childCasePromises);\n          responseData.related.cases = childResults\n            .map(result => result.Item)\n            .filter(Boolean);\n        }\n      } catch (error) {\n        console.error('Error fetching related entities:', error);\n      }\n    }\n\n    // Calculate derived fields\n    responseData.computed = {\n      daysOpen: Math.floor((new Date() - new Date(caseData.createdAt)) / (1000 * 60 * 60 * 24)),\n      isOverdue: false,\n      nextMilestone: null,\n      completionPercentage: 0\n    };\n\n    // Check if case is overdue\n    const now = new Date();\n    if (caseData.targetCompletionDate && new Date(caseData.targetCompletionDate) < now) {\n      responseData.computed.isOverdue = true;\n    }\n    if (caseData.regulatoryDeadline && new Date(caseData.regulatoryDeadline) < now) {\n      responseData.computed.isOverdue = true;\n    }\n\n    // Find next milestone\n    if (caseData.milestones && caseData.milestones.length > 0) {\n      const upcomingMilestones = caseData.milestones\n        .filter(m => m.status === 'pending' && new Date(m.dueDate) >= now)\n        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));\n      \n      if (upcomingMilestones.length > 0) {\n        responseData.computed.nextMilestone = upcomingMilestones[0];\n      }\n    }\n\n    // Calculate completion percentage based on phases\n    const totalPhases = ['initiation', 'evidence_collection', 'analysis', 'interviews', 'verification', 'reporting', 'review', 'closure'];\n    const completedPhases = caseData.phasesCompleted || [];\n    responseData.computed.completionPercentage = Math.round((completedPhases.length / totalPhases.length) * 100);\n\n    return {\n      statusCode: 200,\n      headers: {\n        'Content-Type': 'application/json',\n        'Access-Control-Allow-Origin': '*'\n      },\n      body: JSON.stringify({\n        success: true,\n        data: responseData\n      })\n    };\n\n  } catch (error) {\n    console.error('Error retrieving case:', error);\n    \n    return {\n      statusCode: 500,\n      headers: {\n        'Content-Type': 'application/json',\n        'Access-Control-Allow-Origin': '*'\n      },\n      body: JSON.stringify({\n        error: 'Internal server error',\n        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'\n      })\n    };\n  }\n};\n\n/**\n * Verify user has access to the case\n */\nasync function verifyCaseAccess(caseData, userId, companyId) {\n  try {\n    // Company isolation check\n    if (caseData.companyId !== companyId) {\n      return false;\n    }\n\n    // Check if user is involved in the case\n    if (caseData.createdBy === userId) return true;\n    if (caseData.leadInvestigatorId === userId) return true;\n    if (caseData.investigators && caseData.investigators.includes(userId)) return true;\n    if (caseData.reviewers && caseData.reviewers.includes(userId)) return true;\n\n    // Check sensitivity level access\n    // TODO: Implement role-based access control\n    // For now, allow access to same company users for non-classified cases\n    if (caseData.sensitivityLevel === 'classified') {\n      // Would check if user has classified access\n      return false;\n    }\n\n    // Default: allow access for same company\n    return true;\n\n  } catch (error) {\n    console.error('Error verifying case access:', error);\n    return false;\n  }\n}"