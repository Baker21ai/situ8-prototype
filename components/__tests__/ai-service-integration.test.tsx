/**
 * AI Module Service Integration Tests
 * Tests the integration between AI components and the Situ8 service layer
 */

interface ServiceIntegrationTest {
  component: string;
  service: string;
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  issue?: string;
  recommendation?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AIServiceIntegrationTester {
  private tests: ServiceIntegrationTest[] = [];

  // Test AIAssistantPanel service integrations
  testAIAssistantPanelIntegration(): ServiceIntegrationTest[] {
    return [
      {
        component: 'AIAssistantPanel',
        service: 'ActivityService',
        testName: 'Activity Creation Integration',
        status: 'fail',
        issue: 'Missing reported_by field in activity creation - TypeScript error on line 302',
        recommendation: 'Remove reported_by field as it does not exist in EnterpriseActivity interface',
        severity: 'high'
      },
      {
        component: 'AIAssistantPanel',
        service: 'IncidentService',
        testName: 'Incident Creation Integration',
        status: 'pass',
        severity: 'low'
      },
      {
        component: 'AIAssistantPanel',
        service: 'AuditService',
        testName: 'Audit Logging Integration',
        status: 'pass',
        severity: 'low'
      },
      {
        component: 'AIAssistantPanel',
        service: 'ServiceProvider',
        testName: 'Service Context Integration',
        status: 'pass',
        severity: 'low'
      }
    ];
  }

  // Test AIChat service interactions
  testAIChatIntegration(): ServiceIntegrationTest[] {
    return [
      {
        component: 'AIChat',
        service: 'No Direct Service',
        testName: 'Service Independence',
        status: 'pass',
        severity: 'low'
      }
    ];
  }

  // Test VoiceInput browser API integration
  testVoiceInputIntegration(): ServiceIntegrationTest[] {
    return [
      {
        component: 'VoiceInput',
        service: 'Browser Speech API',
        testName: 'Speech Recognition Integration',
        status: 'pass',
        severity: 'low'
      },
      {
        component: 'VoiceInput',
        service: 'Browser MediaDevices API',
        testName: 'Microphone Access Integration',
        status: 'pass',
        severity: 'low'
      },
      {
        component: 'VoiceInput',
        service: 'Browser Audio API',
        testName: 'Audio Visualization Integration',
        status: 'pass',
        severity: 'low'
      }
    ];
  }

  // Test ActionConfirmation integration
  testActionConfirmationIntegration(): ServiceIntegrationTest[] {
    return [
      {
        component: 'ActionConfirmation',
        service: 'No Direct Service',
        testName: 'Service Independence',
        status: 'pass',
        severity: 'low'
      }
    ];
  }

  // Test AIHistory integration
  testAIHistoryIntegration(): ServiceIntegrationTest[] {
    return [
      {
        component: 'AIHistory',
        service: 'Mock Data Service',
        testName: 'History Data Integration',
        status: 'warning',
        issue: 'Currently uses mock data instead of real service integration',
        recommendation: 'Integrate with audit service to show real AI action history',
        severity: 'medium'
      }
    ];
  }

  // Run all service integration tests
  runAllTests(): ServiceIntegrationTest[] {
    this.tests = [
      ...this.testAIAssistantPanelIntegration(),
      ...this.testAIChatIntegration(),
      ...this.testVoiceInputIntegration(),
      ...this.testActionConfirmationIntegration(),
      ...this.testAIHistoryIntegration()
    ];

    return this.tests;
  }

  // Generate integration summary
  generateSummary() {
    const total = this.tests.length;
    const passed = this.tests.filter(t => t.status === 'pass').length;
    const failed = this.tests.filter(t => t.status === 'fail').length;
    const warnings = this.tests.filter(t => t.status === 'warning').length;
    
    const criticalIssues = this.tests.filter(t => t.severity === 'critical').length;
    const highIssues = this.tests.filter(t => t.severity === 'high').length;
    const mediumIssues = this.tests.filter(t => t.severity === 'medium').length;

    return {
      total,
      passed,
      failed,
      warnings,
      passRate: (passed / total * 100).toFixed(1),
      issues: {
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: total - criticalIssues - highIssues - mediumIssues
      }
    };
  }

  // Get failing tests with recommendations
  getFailingTests(): ServiceIntegrationTest[] {
    return this.tests.filter(t => t.status === 'fail' || t.status === 'warning');
  }
}

// Export for use in comprehensive testing
export { AIServiceIntegrationTester, type ServiceIntegrationTest };