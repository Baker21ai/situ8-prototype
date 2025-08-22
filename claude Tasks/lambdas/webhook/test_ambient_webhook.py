"""
Unit Tests for Ambient Webhook Receiver Lambda Function
"""

import unittest
import json
import os
import hashlib
import hmac
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone

# Import the Lambda function
import sys
sys.path.append('.')
from lambda_function import (
    validate_webhook_signature,
    validate_ambient_payload,
    map_ambient_to_activity,
    lambda_handler
)

class TestAmbientWebhookReceiver(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.valid_ambient_payload = {
            "alert_id": "amb_alert_12345",
            "type": "tailgate",
            "location": "building_a_lobby",
            "timestamp": "2025-08-21T10:30:00Z",
            "severity": "high",
            "confidence": 0.92,
            "preview_url": "https://ambient.ai/preview/amb_alert_12345",
            "metadata": {
                "camera_id": "cam_001",
                "zone": "restricted",
                "duration": 30
            }
        }
        
        self.test_secret = "test_webhook_secret"
        self.test_payload_str = json.dumps(self.valid_ambient_payload)
        
        # Set environment variables for testing
        os.environ['ACTIVITIES_TABLE'] = 'test-activities'
        os.environ['EVENT_BUS_NAME'] = 'test-events'
        os.environ['TENANT_ID'] = 'test-tenant'
        os.environ['AMBIENT_API_KEY'] = self.test_secret

    def test_validate_webhook_signature_valid(self):
        """Test webhook signature validation with valid signature"""
        signature = hmac.new(
            self.test_secret.encode('utf-8'),
            self.test_payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        result = validate_webhook_signature(
            self.test_payload_str, 
            f"sha256={signature}", 
            self.test_secret
        )
        
        self.assertTrue(result)

    def test_validate_webhook_signature_invalid(self):
        """Test webhook signature validation with invalid signature"""
        result = validate_webhook_signature(
            self.test_payload_str, 
            "sha256=invalid_signature", 
            self.test_secret
        )
        
        self.assertFalse(result)

    def test_validate_webhook_signature_missing(self):
        """Test webhook signature validation with missing signature"""
        result = validate_webhook_signature(
            self.test_payload_str, 
            None, 
            self.test_secret
        )
        
        self.assertFalse(result)

    def test_validate_ambient_payload_valid(self):
        """Test payload validation with valid Ambient data"""
        result = validate_ambient_payload(self.valid_ambient_payload)
        self.assertEqual(result, self.valid_ambient_payload)

    def test_validate_ambient_payload_missing_required_field(self):
        """Test payload validation with missing required field"""
        invalid_payload = self.valid_ambient_payload.copy()
        del invalid_payload['alert_id']
        
        with self.assertRaises(ValueError) as context:
            validate_ambient_payload(invalid_payload)
        
        self.assertIn("Missing required field: alert_id", str(context.exception))

    def test_validate_ambient_payload_invalid_severity(self):
        """Test payload validation with invalid severity"""
        invalid_payload = self.valid_ambient_payload.copy()
        invalid_payload['severity'] = 'invalid_severity'
        
        with self.assertRaises(ValueError) as context:
            validate_ambient_payload(invalid_payload)
        
        self.assertIn("Invalid severity", str(context.exception))

    def test_validate_ambient_payload_invalid_confidence(self):
        """Test payload validation with invalid confidence score"""
        invalid_payload = self.valid_ambient_payload.copy()
        invalid_payload['confidence'] = 1.5  # Invalid: > 1.0
        
        with self.assertRaises(ValueError) as context:
            validate_ambient_payload(invalid_payload)
        
        self.assertIn("Confidence must be between 0.0 and 1.0", str(context.exception))

    def test_validate_ambient_payload_invalid_timestamp(self):
        """Test payload validation with invalid timestamp"""
        invalid_payload = self.valid_ambient_payload.copy()
        invalid_payload['timestamp'] = 'invalid_timestamp'
        
        with self.assertRaises(ValueError) as context:
            validate_ambient_payload(invalid_payload)
        
        self.assertIn("Invalid timestamp format", str(context.exception))

    def test_map_ambient_to_activity(self):
        """Test mapping Ambient payload to Situ8 Activity format"""
        result = map_ambient_to_activity(self.valid_ambient_payload)
        
        # Check required fields
        self.assertEqual(result['ambient_alert_id'], 'amb_alert_12345')
        self.assertEqual(result['source'], 'AMBIENT')
        self.assertEqual(result['type'], 'TAILGATING')
        self.assertEqual(result['priority'], 'high')
        self.assertEqual(result['status'], 'PENDING_APPROVAL')
        self.assertEqual(result['confidence_score'], 0.92)
        self.assertEqual(result['preview_url'], 'https://ambient.ai/preview/amb_alert_12345')
        self.assertEqual(result['deep_link_url'], 'https://ambient.ai/alerts/amb_alert_12345')
        
        # Check metadata
        self.assertTrue(result['metadata']['requires_sop_evaluation'])
        self.assertEqual(result['metadata']['created_by'], 'ambient_webhook')
        
        # Check timestamps are valid ISO format
        datetime.fromisoformat(result['created_at'].replace('Z', '+00:00'))
        datetime.fromisoformat(result['updated_at'].replace('Z', '+00:00'))

    def test_map_ambient_to_activity_type_mapping(self):
        """Test various Ambient type mappings"""
        test_cases = [
            ('tailgate', 'TAILGATING'),
            ('slip_fall', 'MEDICAL_EMERGENCY'),
            ('loitering', 'SUSPICIOUS_BEHAVIOR'),
            ('violence', 'SECURITY_THREAT'),
            ('weapon', 'SECURITY_THREAT'),
            ('intrusion', 'UNAUTHORIZED_ACCESS'),
            ('unknown_type', 'GENERAL_SECURITY')  # Default mapping
        ]
        
        for ambient_type, expected_situ8_type in test_cases:
            payload = self.valid_ambient_payload.copy()
            payload['type'] = ambient_type
            
            result = map_ambient_to_activity(payload)
            self.assertEqual(result['type'], expected_situ8_type, 
                           f"Failed for type: {ambient_type}")

    def test_map_ambient_to_activity_severity_mapping(self):
        """Test severity to priority mapping"""
        test_cases = [
            ('low', 'low'),
            ('medium', 'medium'),
            ('high', 'high'),
            ('critical', 'critical'),
            ('unknown', 'medium')  # Default mapping
        ]
        
        for severity, expected_priority in test_cases:
            payload = self.valid_ambient_payload.copy()
            payload['severity'] = severity
            
            result = map_ambient_to_activity(payload)
            self.assertEqual(result['priority'], expected_priority,
                           f"Failed for severity: {severity}")

    @patch('lambda_function.dynamodb')
    @patch('lambda_function.eventbridge')
    def test_lambda_handler_success(self, mock_eventbridge, mock_dynamodb):
        """Test successful Lambda handler execution"""
        # Mock DynamoDB table
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.put_item.return_value = True
        
        # Mock EventBridge
        mock_eventbridge.put_events.return_value = {'FailedEntryCount': 0}
        
        # Create test event
        event = {
            'body': json.dumps(self.valid_ambient_payload),
            'headers': {}
        }
        
        result = lambda_handler(event, {})
        
        # Check response
        self.assertEqual(result['statusCode'], 200)
        response_body = json.loads(result['body'])
        self.assertEqual(response_body['status'], 'success')
        self.assertIn('activity_id', response_body)
        
        # Verify DynamoDB was called
        mock_table.put_item.assert_called_once()
        
        # Verify EventBridge was called
        mock_eventbridge.put_events.assert_called_once()

    def test_lambda_handler_invalid_json(self):
        """Test Lambda handler with invalid JSON"""
        event = {
            'body': 'invalid json',
            'headers': {}
        }
        
        result = lambda_handler(event, {})
        
        self.assertEqual(result['statusCode'], 400)
        response_body = json.loads(result['body'])
        self.assertIn('Invalid JSON payload', response_body['error'])

    def test_lambda_handler_invalid_signature(self):
        """Test Lambda handler with invalid signature"""
        event = {
            'body': json.dumps(self.valid_ambient_payload),
            'headers': {
                'x-ambient-signature': 'sha256=invalid_signature'
            }
        }
        
        result = lambda_handler(event, {})
        
        self.assertEqual(result['statusCode'], 401)
        response_body = json.loads(result['body'])
        self.assertIn('Invalid signature', response_body['error'])

    def test_lambda_handler_validation_error(self):
        """Test Lambda handler with payload validation error"""
        invalid_payload = self.valid_ambient_payload.copy()
        del invalid_payload['alert_id']  # Remove required field
        
        event = {
            'body': json.dumps(invalid_payload),
            'headers': {}
        }
        
        result = lambda_handler(event, {})
        
        self.assertEqual(result['statusCode'], 400)
        response_body = json.loads(result['body'])
        self.assertIn('Missing required field', response_body['error'])

    @patch('lambda_function.dynamodb')
    def test_lambda_handler_storage_failure(self, mock_dynamodb):
        """Test Lambda handler with DynamoDB storage failure"""
        # Mock DynamoDB failure
        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.put_item.side_effect = Exception("DynamoDB error")
        
        event = {
            'body': json.dumps(self.valid_ambient_payload),
            'headers': {}
        }
        
        result = lambda_handler(event, {})
        
        self.assertEqual(result['statusCode'], 500)
        response_body = json.loads(result['body'])
        self.assertIn('Failed to store activity', response_body['error'])

class TestIntegrationScenarios(unittest.TestCase):
    """Integration test scenarios for real-world use cases"""
    
    def setUp(self):
        os.environ['ACTIVITIES_TABLE'] = 'test-activities'
        os.environ['EVENT_BUS_NAME'] = 'test-events'
        os.environ['TENANT_ID'] = 'test-tenant'

    def test_high_confidence_tailgate_scenario(self):
        """Test high-confidence tailgating scenario"""
        payload = {
            "alert_id": "amb_tailgate_001",
            "type": "tailgate",
            "location": "hq_main_entrance",
            "timestamp": "2025-08-21T09:15:00Z",
            "severity": "critical",
            "confidence": 0.95,
            "preview_url": "https://ambient.ai/preview/amb_tailgate_001",
            "metadata": {
                "camera_id": "entrance_cam_01",
                "zone": "secure_area",
                "duration": 15,
                "person_count": 2
            }
        }
        
        activity = map_ambient_to_activity(payload)
        
        # Should be high priority due to critical severity
        self.assertEqual(activity['priority'], 'critical')
        self.assertEqual(activity['type'], 'TAILGATING')
        self.assertEqual(activity['status'], 'PENDING_APPROVAL')
        self.assertTrue(activity['metadata']['requires_sop_evaluation'])

    def test_low_confidence_loitering_scenario(self):
        """Test low-confidence loitering scenario"""
        payload = {
            "alert_id": "amb_loiter_002",
            "type": "loitering",
            "location": "parking_lot_b",
            "timestamp": "2025-08-21T14:30:00Z",
            "severity": "low",
            "confidence": 0.65,
            "preview_url": "https://ambient.ai/preview/amb_loiter_002"
        }
        
        activity = map_ambient_to_activity(payload)
        
        # Should be low priority
        self.assertEqual(activity['priority'], 'low')
        self.assertEqual(activity['type'], 'SUSPICIOUS_BEHAVIOR')
        self.assertEqual(activity['confidence_score'], 0.65)

    def test_medical_emergency_scenario(self):
        """Test medical emergency (slip and fall) scenario"""
        payload = {
            "alert_id": "amb_medical_003",
            "type": "slip_fall",
            "location": "cafeteria_main_floor",
            "timestamp": "2025-08-21T12:45:00Z",
            "severity": "high",
            "confidence": 0.88,
            "preview_url": "https://ambient.ai/preview/amb_medical_003",
            "metadata": {
                "camera_id": "cafeteria_cam_02",
                "zone": "public_area",
                "duration": 45,
                "incident_type": "fall_detected"
            }
        }
        
        activity = map_ambient_to_activity(payload)
        
        # Should map to medical emergency type
        self.assertEqual(activity['type'], 'MEDICAL_EMERGENCY')
        self.assertEqual(activity['priority'], 'high')
        # Medical emergencies should require immediate SOP evaluation
        self.assertTrue(activity['metadata']['requires_sop_evaluation'])

def run_tests():
    """Run all tests and return results"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestAmbientWebhookReceiver))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegrationScenarios))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    return result

if __name__ == '__main__':
    print("Running Ambient Webhook Receiver Tests...")
    print("=" * 60)
    
    result = run_tests()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED!")
        sys.exit(1)