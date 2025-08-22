#!/usr/bin/env python3
"""
Simple test runner for Ambient Webhook Lambda function
"""

import sys
import os
import json
import hashlib
import hmac
from datetime import datetime, timezone

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the functions we want to test
try:
    from lambda_function import (
        validate_webhook_signature,
        validate_ambient_payload,
        map_ambient_to_activity
    )
    print("✅ Successfully imported Lambda functions")
except ImportError as e:
    print(f"❌ Failed to import Lambda functions: {e}")
    sys.exit(1)

def test_webhook_signature_validation():
    """Test webhook signature validation"""
    print("\n🧪 Testing webhook signature validation...")
    
    secret = "test_secret"
    payload = '{"test": "data"}'
    
    # Generate valid signature
    signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Test valid signature
    result = validate_webhook_signature(payload, f"sha256={signature}", secret)
    assert result == True, "Valid signature should pass"
    print("  ✅ Valid signature test passed")
    
    # Test invalid signature
    result = validate_webhook_signature(payload, "sha256=invalid", secret)
    assert result == False, "Invalid signature should fail"
    print("  ✅ Invalid signature test passed")
    
    # Test missing signature
    result = validate_webhook_signature(payload, None, secret)
    assert result == False, "Missing signature should fail"
    print("  ✅ Missing signature test passed")

def test_payload_validation():
    """Test Ambient payload validation"""
    print("\n🧪 Testing payload validation...")
    
    # Valid payload
    valid_payload = {
        "alert_id": "test_123",
        "type": "tailgate",
        "location": "lobby",
        "timestamp": "2025-08-21T10:30:00Z",
        "severity": "high",
        "confidence": 0.92
    }
    
    # Test valid payload
    try:
        result = validate_ambient_payload(valid_payload)
        assert result == valid_payload, "Valid payload should be returned unchanged"
        print("  ✅ Valid payload test passed")
    except ValueError:
        print("  ❌ Valid payload test failed")
        raise
    
    # Test missing required field
    invalid_payload = valid_payload.copy()
    del invalid_payload['alert_id']
    
    try:
        validate_ambient_payload(invalid_payload)
        print("  ❌ Missing field test failed - should have raised ValueError")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Missing required field: alert_id" in str(e)
        print("  ✅ Missing field test passed")
    
    # Test invalid severity
    invalid_payload = valid_payload.copy()
    invalid_payload['severity'] = 'invalid'
    
    try:
        validate_ambient_payload(invalid_payload)
        print("  ❌ Invalid severity test failed - should have raised ValueError")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Invalid severity" in str(e)
        print("  ✅ Invalid severity test passed")
    
    # Test invalid confidence
    invalid_payload = valid_payload.copy()
    invalid_payload['confidence'] = 1.5
    
    try:
        validate_ambient_payload(invalid_payload)
        print("  ❌ Invalid confidence test failed - should have raised ValueError")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Confidence must be between 0.0 and 1.0" in str(e)
        print("  ✅ Invalid confidence test passed")

def test_activity_mapping():
    """Test Ambient to Activity mapping"""
    print("\n🧪 Testing activity mapping...")
    
    ambient_payload = {
        "alert_id": "amb_123",
        "type": "tailgate",
        "location": "main_entrance",
        "timestamp": "2025-08-21T10:30:00Z",
        "severity": "high",
        "confidence": 0.85,
        "preview_url": "https://ambient.ai/preview/amb_123",
        "metadata": {
            "camera_id": "cam_001",
            "zone": "secure"
        }
    }
    
    # Mock environment
    os.environ['TENANT_ID'] = 'test-tenant'
    
    activity = map_ambient_to_activity(ambient_payload)
    
    # Test basic mapping
    assert activity['ambient_alert_id'] == 'amb_123', "Alert ID should be mapped"
    assert activity['source'] == 'AMBIENT', "Source should be AMBIENT"
    assert activity['type'] == 'TAILGATING', "Type should be mapped correctly"
    assert activity['priority'] == 'high', "Priority should be mapped from severity"
    assert activity['status'] == 'PENDING_APPROVAL', "Status should be pending approval"
    assert activity['confidence_score'] == 0.85, "Confidence should be mapped"
    assert activity['preview_url'] == 'https://ambient.ai/preview/amb_123', "Preview URL should be mapped"
    assert 'ambient_alert_id' in activity['deep_link_url'], "Deep link should contain alert ID"
    print("  ✅ Basic mapping test passed")
    
    # Test type mappings
    type_tests = [
        ('tailgate', 'TAILGATING'),
        ('slip_fall', 'MEDICAL_EMERGENCY'),
        ('loitering', 'SUSPICIOUS_BEHAVIOR'),
        ('violence', 'SECURITY_THREAT'),
        ('unknown_type', 'GENERAL_SECURITY')
    ]
    
    for ambient_type, expected_type in type_tests:
        test_payload = ambient_payload.copy()
        test_payload['type'] = ambient_type
        result = map_ambient_to_activity(test_payload)
        assert result['type'] == expected_type, f"Type {ambient_type} should map to {expected_type}"
    
    print("  ✅ Type mapping test passed")
    
    # Test severity mappings
    severity_tests = [
        ('low', 'low'),
        ('medium', 'medium'),
        ('high', 'high'),
        ('critical', 'critical')
    ]
    
    for severity, expected_priority in severity_tests:
        test_payload = ambient_payload.copy()
        test_payload['severity'] = severity
        result = map_ambient_to_activity(test_payload)
        assert result['priority'] == expected_priority, f"Severity {severity} should map to {expected_priority}"
    
    print("  ✅ Severity mapping test passed")
    
    # Test metadata
    assert activity['metadata']['requires_sop_evaluation'] == True, "Should require SOP evaluation"
    assert activity['metadata']['created_by'] == 'ambient_webhook', "Should be created by webhook"
    assert 'ambient_metadata' in activity['metadata'], "Should include original metadata"
    print("  ✅ Metadata test passed")

def test_integration_scenarios():
    """Test real-world integration scenarios"""
    print("\n🧪 Testing integration scenarios...")
    
    # High-confidence tailgate scenario
    tailgate_payload = {
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
            "duration": 15
        }
    }
    
    activity = map_ambient_to_activity(tailgate_payload)
    assert activity['priority'] == 'critical', "Critical tailgate should be critical priority"
    assert activity['type'] == 'TAILGATING', "Should be tailgating type"
    assert activity['confidence_score'] == 0.95, "Should preserve confidence"
    print("  ✅ High-confidence tailgate scenario passed")
    
    # Medical emergency scenario
    medical_payload = {
        "alert_id": "amb_medical_001",
        "type": "slip_fall",
        "location": "cafeteria",
        "timestamp": "2025-08-21T12:45:00Z",
        "severity": "high",
        "confidence": 0.88
    }
    
    activity = map_ambient_to_activity(medical_payload)
    assert activity['type'] == 'MEDICAL_EMERGENCY', "Should be medical emergency"
    assert activity['priority'] == 'high', "Medical emergency should be high priority"
    print("  ✅ Medical emergency scenario passed")

def run_all_tests():
    """Run all tests"""
    print("🚀 Starting Ambient Webhook Lambda Tests")
    print("=" * 50)
    
    try:
        test_webhook_signature_validation()
        test_payload_validation()
        test_activity_mapping()
        test_integration_scenarios()
        
        print("\n" + "=" * 50)
        print("🎉 ALL TESTS PASSED!")
        print("✅ Webhook signature validation working")
        print("✅ Payload validation working")
        print("✅ Activity mapping working")
        print("✅ Integration scenarios working")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)