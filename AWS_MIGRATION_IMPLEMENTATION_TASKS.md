# AWS MIGRATION IMPLEMENTATION TASKS

## Overview: Why We're Migrating to AWS

### The Goal
Transform Situ8 from in-memory Zustand stores to **production-ready AWS backend** for scalable, multi-user deployment. This migration preserves all existing functionality while adding cloud persistence, real-time capabilities, and enterprise scalability.

### The Approach: Service Layer Preservation
We're leveraging the existing service architecture:
- **Service Layer (Unchanged)**: All business logic remains in `services/` directory
- **AWS Integration (New)**: Replace Zustand stores with DynamoDB + API Gateway + Lambda
- **UI Components (Minimal Changes)**: Only change from store calls to API calls

### Why This Matters for Production
1. **Data persistence**: Survives browser refresh and multiple users
2. **Real-time updates**: WebSocket connections for live collaboration
3. **Enterprise credibility**: AWS infrastructure impresses prospects
4. **Scalability**: Handle hundreds of concurrent users
5. **File storage**: Evidence photos and documents in S3

### Expected Production Benefits
- Multiple users can collaborate simultaneously
- Data persists across sessions and devices
- Real-time updates appear instantly across all connected users
- Professional cloud infrastructure for enterprise customers
- Handles 30+ facilities with thousands of activities

---

## IMPLEMENTATION TASKS

### 🔴 PHASE 1: AWS INFRASTRUCTURE SETUP (Day 1)

#### 1. AWS ACCOUNT SETUP - Create AWS account and request Bedrock access
- [ ] Create AWS account (if needed) with business email
- [ ] Navigate to AWS Bedrock service in us-west-2 region
- [ ] Request access to required models (Claude 3 Sonnet, Haiku, Titan Embeddings)
- [ ] Wait for model access approval (24-48 hours)
- [ ] Create IAM user with Bedrock, DynamoDB, Lambda, API Gateway permissions

#### 2. AWS CLI SETUP - Install and configure AWS CLI for local development
- [x] ✅ **DOWNLOADED**: AWS CLI v2 installer (AWSCLIV2.pkg) - READY FOR MANUAL INSTALL
- [ ] **MANUAL STEP**: Run `sudo installer -pkg AWSCLIV2.pkg -target /` (requires password)
- [ ] Test installation: `aws --version`
- [ ] Configure credentials: `aws configure` (or verify existing ~/.aws/credentials)
- [ ] Test connection: `aws dynamodb list-tables --region us-east-1`
- [ ] Verify Bedrock access: `aws bedrock list-foundation-models --region us-west-2`

#### 3. DYNAMODB TABLES - Create tables for all 5 stores (Activities, Incidents, Cases, BOL, Audit)
- [ ] Create Activities table: `aws dynamodb create-table --table-name Situ8-Activities --attribute-definitions AttributeName=activityId,AttributeType=S --key-schema AttributeName=activityId,KeyType=HASH --billing-mode PAY_PER_REQUEST`
- [ ] Create Incidents table with GSI for priority queries
- [ ] Create Cases table with GSI for status-based queries
- [ ] Create BOL table with GSI for facility-date queries
- [ ] Create Audit table with GSI for entityType-timestamp queries
- [ ] Verify all tables created: `aws dynamodb list-tables`

#### 4. S3 BUCKET SETUP - Create bucket for evidence photos and document storage
- [ ] Create S3 bucket: `aws s3 mb s3://situ8-evidence-storage-[random-suffix]`
- [ ] Configure bucket policy for presigned URL uploads
- [ ] Set up CORS configuration for frontend uploads
- [ ] Test bucket access: `aws s3 ls s3://situ8-evidence-storage-[suffix]`

#### 5. API GATEWAY SETUP - Create REST API and WebSocket API endpoints
- [ ] Create REST API via AWS Console: "Situ8-Security-API"
- [ ] Create WebSocket API for real-time updates: "Situ8-Realtime-API"
- [ ] Configure CORS settings for frontend integration
- [ ] Note down API Gateway URLs for environment variables

### 🟡 PHASE 2: LAMBDA FUNCTIONS SETUP (Day 2)

#### 6. LAMBDA ACTIVITIES API - Port ActivityService business logic to Lambda
- [ ] Create Lambda function: `activities-api`
- [ ] Copy ActivityService logic from `services/activity.service.ts`
- [ ] Implement DynamoDB adapter for data operations
- [ ] Handle HTTP methods: GET (list), POST (create), PUT (update), DELETE (soft delete)
- [ ] Test function: `aws lambda invoke --function-name activities-api test-output.json`

#### 7. LAMBDA INCIDENTS API - Port IncidentService business logic to Lambda
- [ ] Create Lambda function: `incidents-api`
- [ ] Copy IncidentService logic including auto-creation rules
- [ ] Implement incident escalation and validation workflows
- [ ] Connect to Activities table for incident creation from activities
- [ ] Test CRUD operations and business logic

#### 8. LAMBDA CASES API - Port CaseService business logic to Lambda
- [ ] Create Lambda function: `cases-api`
- [ ] Copy CaseService logic for investigation management
- [ ] Implement evidence tracking and chain of custody
- [ ] Connect to S3 for evidence file storage
- [ ] Test case creation and evidence management

#### 9. LAMBDA BOL API - Port BOLService business logic to Lambda
- [ ] Create Lambda function: `bol-api`
- [ ] Copy BOLService pattern matching logic
- [ ] Implement confidence scoring and multi-site distribution
- [ ] Connect to Activities API for BOL event creation
- [ ] Test pattern matching and activity generation

#### 10. LAMBDA AUDIT API - Port AuditService business logic to Lambda
- [ ] Create Lambda function: `audit-api`
- [ ] Copy AuditService compliance tracking logic
- [ ] Implement audit trail creation and querying
- [ ] Connect all other APIs to log audit events
- [ ] Test audit logging and compliance reporting

#### 11. WEBSOCKET LAMBDA - Implement real-time updates for live collaboration
- [ ] Create Lambda function: `websocket-handler`
- [ ] Implement connection management (connect, disconnect)
- [ ] Create message broadcasting for activity/incident updates
- [ ] Connect to DynamoDB streams for automatic notifications
- [ ] Test WebSocket connections: `wscat -c wss://your-websocket-url`

#### 12. FILE UPLOAD LAMBDA - Generate presigned URLs for direct S3 uploads
- [ ] Create Lambda function: `file-upload-api`
- [ ] Implement presigned URL generation for evidence uploads
- [ ] Add file type validation and size limits
- [ ] Return secure upload URLs to frontend
- [ ] Test file upload workflow end-to-end

### 🟢 PHASE 3: FRONTEND INTEGRATION (Day 3)

#### 13. AWS API CLIENT - Create unified API client for all AWS services
- [ ] Create `services/aws-api.ts` with all endpoint methods
- [ ] Implement error handling and retry logic
- [ ] Add authentication headers and request signing
- [ ] Create TypeScript interfaces for all API responses
- [ ] Test all API methods with mock data

#### 14. ENVIRONMENT VARIABLES - Set up configuration for all AWS services
- [ ] Create `.env.local` with all AWS configuration
- [ ] Add API Gateway URLs, DynamoDB table names, S3 bucket name
- [ ] Set up development vs production environment configs
- [ ] Add error handling for missing environment variables
- [ ] Document all required environment variables

#### 15. ACTIVITIES INTEGRATION - Replace ActivityStore Zustand calls with API calls
- [ ] Update `components/Activities.tsx` to use AWS API client
- [ ] Replace `useActivityStore()` calls with API client methods
- [ ] Add loading states for async operations
- [ ] Implement error handling and user feedback
- [ ] Test all activity operations: create, read, update, delete

#### 16. INCIDENTS INTEGRATION - Replace IncidentStore Zustand calls with API calls
- [ ] Update `components/Timeline.tsx` to use incidents API
- [ ] Replace incident store calls with API client methods
- [ ] Implement real-time incident updates via WebSocket
- [ ] Add pending incident validation UI
- [ ] Test incident auto-creation from activities

#### 17. CASES INTEGRATION - Replace CaseStore Zustand calls with API calls
- [ ] Update `components/Cases.tsx` to use cases API
- [ ] Replace case store calls with API client methods
- [ ] Implement evidence upload to S3 with presigned URLs
- [ ] Add case creation from incidents workflow
- [ ] Test complete case management workflow

#### 18. WEBSOCKET CLIENT - Implement real-time connection management
- [ ] Create `hooks/useWebSocket.ts` for connection management
- [ ] Implement automatic reconnection on connection loss
- [ ] Add connection status indicators in UI
- [ ] Handle different message types (activity updates, incident alerts)
- [ ] Test real-time updates across multiple browser tabs

#### 19. LOADING STATES - Add loading states and error handling throughout UI
- [ ] Update all components to show loading spinners during API calls
- [ ] Implement error boundaries for API failures
- [ ] Add retry buttons for failed operations
- [ ] Create consistent error message display
- [ ] Test error handling scenarios (network failures, API errors)

#### 20. FILE UPLOAD UI - Integrate S3 file upload functionality
- [ ] Update evidence components to use presigned URL uploads
- [ ] Add drag-and-drop file upload interface
- [ ] Implement upload progress indicators
- [ ] Add file type and size validation on frontend
- [ ] Test file uploads for evidence and document storage

### 🔵 PHASE 4: TESTING & VALIDATION (Day 4)

#### 21. API ENDPOINT TESTING - Test all CRUD operations for each service
- [ ] Test Activities API: GET /activities, POST /activities, PUT /activities/{id}, DELETE /activities/{id}
- [ ] Test Incidents API: All CRUD operations plus auto-creation workflows
- [ ] Test Cases API: All CRUD operations plus evidence management
- [ ] Test BOL API: Pattern matching and activity generation
- [ ] Test Audit API: Logging and compliance queries
- [ ] Use Postman or curl to verify all endpoints work correctly

#### 22. WEBSOCKET TESTING - Verify real-time updates work across multiple connections
- [ ] Open multiple browser tabs/windows to the application
- [ ] Create activity in one tab, verify it appears in others instantly
- [ ] Test incident creation and updates across connections
- [ ] Verify WebSocket reconnection after network interruption
- [ ] Test message broadcasting to all connected clients

#### 23. FILE UPLOAD TESTING - Verify S3 integration works end-to-end
- [ ] Test evidence photo uploads from Cases component
- [ ] Verify files are stored in correct S3 bucket structure
- [ ] Test file download and viewing from stored URLs
- [ ] Verify file type restrictions and size limits work
- [ ] Test upload progress and error handling

#### 24. DATA PERSISTENCE TESTING - Confirm data survives browser sessions
- [ ] Create activities, incidents, and cases
- [ ] Close browser completely and reopen application
- [ ] Verify all data is still present and accessible
- [ ] Test data consistency across multiple user sessions
- [ ] Verify audit trails are maintained correctly

#### 25. PERFORMANCE TESTING - Ensure AWS backend performs well under load
- [ ] Test with 100+ activities loaded simultaneously
- [ ] Measure API response times (should be <2 seconds for 95th percentile)
- [ ] Test concurrent user operations (multiple users creating activities)
- [ ] Verify WebSocket message delivery under high load
- [ ] Monitor AWS CloudWatch metrics for performance issues

#### 26. ERROR HANDLING TESTING - Verify graceful handling of all error scenarios
- [ ] Test API failures (simulate Lambda function errors)
- [ ] Test network connectivity issues
- [ ] Test DynamoDB throttling scenarios
- [ ] Test S3 upload failures
- [ ] Verify user-friendly error messages are displayed

### 🟣 PHASE 5: PRODUCTION DEPLOYMENT (Day 5)

#### 27. CORS CONFIGURATION - Configure all Lambda functions for frontend integration
- [ ] Add CORS headers to all Lambda function responses
- [ ] Set Access-Control-Allow-Origin for production domain
- [ ] Configure preflight OPTIONS request handling
- [ ] Test CORS from production frontend URL
- [ ] Verify no CORS errors in browser console

#### 28. ENVIRONMENT SETUP - Configure production environment variables
- [ ] Set up production .env file with real AWS endpoints
- [ ] Configure production API Gateway URLs
- [ ] Set up production DynamoDB table names
- [ ] Configure production S3 bucket access
- [ ] Test all environment configurations work correctly

#### 29. MONITORING SETUP - Set up CloudWatch logging and monitoring
- [ ] Configure CloudWatch logs for all Lambda functions
- [ ] Set up DynamoDB metrics monitoring
- [ ] Create CloudWatch alarms for error rates and latency
- [ ] Set up cost monitoring alerts to stay within budget
- [ ] Test monitoring dashboards and alerts

#### 30. COST OPTIMIZATION - Verify staying within AWS free tier limits
- [ ] Monitor DynamoDB read/write units (free tier: 25 units)
- [ ] Monitor Lambda invocations (free tier: 1M requests/month)
- [ ] Monitor S3 storage usage (free tier: 5GB)
- [ ] Set up billing alerts at $5, $10, $25 thresholds
- [ ] Document expected costs for production usage

#### 31. BACKUP & RECOVERY - Set up data backup and recovery procedures
- [ ] Configure DynamoDB point-in-time recovery
- [ ] Set up S3 bucket versioning for file recovery
- [ ] Create Lambda function backup procedures
- [ ] Document disaster recovery procedures
- [ ] Test backup and restore processes

#### 32. SECURITY REVIEW - Ensure production security best practices
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Ensure no hardcoded credentials in code
- [ ] Verify all API endpoints require proper authentication
- [ ] Review S3 bucket policies and access controls
- [ ] Conduct security vulnerability scan

### 🏁 FINAL VALIDATION & DEPLOYMENT

#### 33. END-TO-END WORKFLOW TESTING - Test complete user workflows
- [ ] Complete workflow: Create Activity → Escalate to Incident → Create Case → Add Evidence
- [ ] Multi-user workflow: User A creates activity, User B validates, User C investigates
- [ ] Real-time workflow: Activities appear instantly across all connected users
- [ ] File workflow: Upload evidence photos, view in case management
- [ ] Audit workflow: All actions logged correctly for compliance

#### 34. USER ACCEPTANCE TESTING - Verify user experience meets requirements
- [ ] Test with actual security personnel (if possible)
- [ ] Verify response times meet user expectations
- [ ] Confirm all existing functionality works identically
- [ ] Test on different devices and browsers
- [ ] Gather feedback and address any usability issues

#### 35. PRODUCTION DEPLOYMENT - Deploy to live environment
- [ ] Deploy all Lambda functions to production
- [ ] Update frontend with production API endpoints
- [ ] Configure production domain and SSL certificates
- [ ] Run final smoke tests on production environment
- [ ] Monitor for any issues during first 24 hours

---

## 📊 SUCCESS CRITERIA

### Technical Metrics
- [ ] **API Response Time**: 95th percentile < 2 seconds
- [ ] **WebSocket Latency**: Real-time updates < 100ms
- [ ] **System Availability**: 99.9% uptime
- [ ] **Error Rate**: < 1% of all requests
- [ ] **File Upload Success**: 99% success rate

### Business Metrics
- [ ] **Data Persistence**: 100% of data survives browser sessions
- [ ] **Multi-User Support**: 10+ concurrent users supported
- [ ] **Real-Time Updates**: Updates appear within 1 second across all connected users
- [ ] **Feature Parity**: All existing functionality works identically
- [ ] **Cost Efficiency**: Stay within $50/month for production usage

### User Experience Metrics
- [ ] **Performance**: No noticeable slowdown from current in-memory system
- [ ] **Reliability**: Zero data loss incidents
- [ ] **Usability**: No additional complexity for end users
- [ ] **Professional Feel**: AWS infrastructure impresses enterprise prospects
- [ ] **Scalability**: System ready for 100+ facilities

---

## 🐛 TROUBLESHOOTING GUIDE

### Common AWS Issues
- **CORS Errors**: Add proper headers to Lambda responses
- **DynamoDB Access Denied**: Check IAM permissions and table policies
- **Lambda Cold Starts**: Implement warming strategy for critical functions
- **S3 Upload Failures**: Verify bucket policy and presigned URL generation
- **WebSocket Disconnections**: Implement automatic reconnection logic

### Development Issues
- **Environment Variables**: Verify all required vars are set correctly
- **TypeScript Errors**: Update interfaces to match AWS API responses
- **API Client Errors**: Add proper error handling and retry logic
- **Loading States**: Ensure all async operations show loading indicators
- **Testing Failures**: Use AWS LocalStack for local development testing

### Production Issues
- **High Latency**: Optimize Lambda function code and DynamoDB queries
- **Cost Overruns**: Implement request caching and optimize query patterns
- **Security Concerns**: Rotate credentials and review access policies
- **Monitoring Gaps**: Set up comprehensive CloudWatch dashboards
- **Backup Failures**: Verify backup procedures and test restore processes

---

## 💰 COST MONITORING

### Free Tier Limits (First 12 Months)
- **DynamoDB**: 25GB storage, 25 read/write capacity units
- **Lambda**: 1M requests, 400,000 GB-seconds compute time
- **API Gateway**: 1M API calls
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- **CloudWatch**: 10 custom metrics, 1M API requests

### Expected Production Costs (After Free Tier)
- **DynamoDB**: ~$10-20/month (moderate usage)
- **Lambda**: ~$5-10/month (API processing)
- **API Gateway**: ~$5-10/month (WebSocket + REST)
- **S3**: ~$5/month (file storage)
- **CloudWatch**: ~$5/month (monitoring)
- **Total**: ~$30-50/month for production deployment

### Cost Optimization Strategies
- Use DynamoDB on-demand pricing for variable workloads
- Implement Lambda function warming to reduce cold starts
- Use S3 Intelligent Tiering for file storage optimization
- Set up CloudWatch cost alerts at $25, $50 thresholds
- Monitor and optimize high-cost operations regularly

---

This comprehensive task list provides a systematic approach to migrating Situ8 from in-memory Zustand stores to a production-ready AWS backend. Each checkbox represents a concrete, achievable task that builds toward the ultimate goal of a scalable, enterprise-ready security platform.

**Total Estimated Time: 5 days of focused development**
**Total Estimated Cost: $0-50 first year, $30-50/month after**
**Expected ROI: 300%+ through enterprise credibility and scalability**