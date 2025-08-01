# AI Agent Research Prompt for Claude

## 🎯 Research Mission

You are a senior AI consultant and compliance expert. I need you to research and analyze implementing an AI agent for a security operations platform called Situ8. Provide a comprehensive analysis covering technical implementation, compliance requirements, and legal considerations.

## 📋 Context: What Situ8 Does

Situ8 is a security operations platform that manages:
- **Incident Management**: Security breaches, medical emergencies, fire alarms
- **Activity Tracking**: Security patrols, visitor management, equipment monitoring
- **Audit Trails**: Complete "WHO, WHAT, WHEN, WHERE, WHY" logging
- **Real-time Operations**: 24/7 security monitoring and response

**Target Customers**: Enterprise security (banks, hospitals, government, corporate campuses)

## 🔍 Research Requirements

### 1. AI Agent Use Case Analysis
Research and explain in layman's terms:

**A. What AI Agent Should Do:**
- Chat with security operators in natural language
- Understand requests like "Create an incident for medical emergency in Building A"
- Automatically create incidents, activities, and search records
- Provide intelligent recommendations and insights
- Integrate with existing Situ8 systems seamlessly

**B. Technical Implementation:**
- How AWS Bedrock works (explain like I'm 15 years old)
- Which Bedrock models are best for security operations
- How to connect Bedrock to existing React/TypeScript application
- Function calling capabilities for creating incidents/activities
- Streaming vs non-streaming responses
- Cost implications and usage patterns

**C. Architecture Integration:**
- How AI agent fits into existing Situ8 architecture
- Data flow: User → AI → Existing Services → Database
- Error handling and fallback systems
- Performance considerations for 24/7 operations

### 2. AWS Bedrock Deep Dive
Provide comprehensive analysis of:

**A. Service Capabilities:**
- Available foundation models (Claude, Llama, Titan)
- Function calling and tool use
- Streaming capabilities
- Regional availability
- Pricing models and cost optimization

**B. Security Features:**
- Data encryption (at rest and in transit)
- VPC integration and PrivateLink
- IAM roles and permissions
- Audit logging capabilities
- Data residency controls

**C. Enterprise Features:**
- Multi-tenancy support
- Rate limiting and throttling
- Monitoring and observability
- Backup and disaster recovery

### 3. Compliance Requirements for Security Industry
Research and explain compliance needs for:

**A. Required Standards:**
- SOC 2 Type II (explain what this means)
- ISO 27001 (information security management)
- NIST Cybersecurity Framework
- Industry-specific requirements (healthcare, finance, government)

**B. Specific Compliance Areas:**
- Data protection and privacy (GDPR, CCPA)
- Access controls and authentication
- Audit trails and logging
- Data retention and deletion
- Incident response procedures

**C. AI-Specific Compliance:**
- AI transparency and explainability
- Bias monitoring and fairness
- Human oversight requirements
- AI decision audit trails
- Model governance and validation

### 4. Legal and Regulatory Analysis
Research and confirm:

**A. Legal Considerations:**
- Is using AI for security operations legal in US/Canada/EU?
- Liability issues when AI makes decisions
- Data processing agreements with AWS
- Cross-border data transfer regulations
- Insurance and risk management

**B. Industry Regulations:**
- Physical security industry regulations
- Healthcare compliance (if applicable)
- Financial services compliance (if applicable)
- Government/defense contractor requirements

**C. Risk Mitigation:**
- What legal protections are needed?
- Required disclaimers and limitations
- Human oversight requirements
- Audit and compliance documentation

### 5. Implementation Roadmap
Provide step-by-step guidance:

**A. Phase 1 (Foundation - 3 months):**
- Exact steps to implement basic AI agent
- Compliance requirements that MUST be implemented
- Legal documentation needed
- Testing and validation procedures

**B. Compliance Implementation:**
- Week-by-week compliance checklist
- Required security controls
- Documentation requirements
- Certification processes

**C. Go-Live Requirements:**
- Legal review checklist
- Compliance validation
- Risk assessment
- Customer communication strategy

## 🎯 Specific Questions to Answer

1. **Is this legal?** Can I legally use AWS Bedrock AI for security operations?
2. **What compliance do I need?** Exactly which certifications/standards are required?
3. **How do I get compliant?** Step-by-step process in simple terms
4. **What are the risks?** Legal, technical, and business risks
5. **How much will it cost?** Implementation and ongoing compliance costs
6. **Timeline?** Realistic timeline for compliant implementation
7. **Competitive advantage?** How does this differentiate from competitors?

## 📊 Deliverable Format

Structure your response as:

### Executive Summary (2-3 paragraphs)
- Is this feasible and legal?
- Key compliance requirements
- Recommended approach

### Technical Analysis
- AWS Bedrock capabilities and limitations
- Integration approach with existing systems
- Architecture recommendations

### Compliance Deep Dive
- Required standards and certifications
- Implementation checklist
- Legal considerations

### Implementation Plan
- Phase-by-phase roadmap
- Compliance timeline
- Cost breakdown

### Risk Assessment
- Technical risks and mitigation
- Legal risks and protections
- Business risks and opportunities

## 🎓 Education Level
Explain everything in layman's terms as if teaching someone new to software engineering. Use analogies and simple language while maintaining technical accuracy.

## 🔍 Research Sources
Please research current (2024-2025) information from:
- AWS official documentation
- Compliance frameworks (SOC 2, ISO 27001, NIST)
- Industry best practices
- Legal and regulatory guidance
- Competitor analysis

---

**Goal**: Provide me with everything I need to confidently implement an AI agent that is both technically sound and legally compliant for the security industry.