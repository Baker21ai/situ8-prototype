#!/usr/bin/env python3
"""
Test core functions without AWS dependencies
"""

import sys
import os
import json
import hashlib
import hmac
from datetime import datetime, timezone

def validate_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """Validate webhook signature using HMAC-SHA256"""
    if not signature or not secret:
        return False
    
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected_signature}", signature)

def validate_ambient_payload(payload: dict) -> dict:
    """Validate incoming Ambient webhook payload"""
    required_fields = ['alert_id', 'type', 'location', 'timestamp', 'severity']
    errors = []
    
    # Check required fields
    for field in required_fields:
        if field not in payload:
            errors.append(f"Missing required field: {field}")
    
    # Validate field types and values
    if 'severity' in payload:
        valid_severities = ['low', 'medium', 'high', 'critical']
        if payload['severity'] not in valid_severities:
            errors.append(f"Invalid severity: {payload['severity']}")
    
    if 'confidence' in payload:
        try:
            confidence = float(payload['confidence'])
            if not 0.0 <= confidence <= 1.0:
                errors.append("Confidence must be between 0.0 and 1.0")
        except (ValueError, TypeError):
            errors.append("Confidence must be a number")
    
    if 'timestamp' in payload:
        try:
            datetime.fromisoformat(payload['timestamp'].replace('Z', '+00:00'))
        except ValueError:
            errors.append("Invalid timestamp format. Use ISO 8601")
    
    if errors:
        raise ValueError(f"Validation errors: {'; '.join(errors)}")
    
    return payload

def map_ambient_to_activity(ambient_payload: dict) -> dict:
    """Map Ambient webhook payload to Situ8 Activity format"""
    
    # Map Ambient severity to Situ8 priority
    severity_map = {
        'low': 'low',
        'medium': 'medium', 
        'high': 'high',
        'critical': 'critical'
    }
    
    # Map Ambient types to Situ8 activity types
    type_map = {
        'tailgate': 'TAILGATING',
        'slip_fall': 'MEDICAL_EMERGENCY',
        'loitering': 'SUSPICIOUS_BEHAVIOR',
        'violence': 'SECURITY_THREAT',
        'weapon': 'SECURITY_THREAT',
        'intrusion': 'UNAUTHORIZED_ACCESS'
    }
    
    TENANT_ID = os.environ.get('TENANT_ID', 'default')
    
    activity = {
        'id': f"ambient_{ambient_payload['alert_id']}",
        'tenant_id': TENANT_ID,
        'ambient_alert_id': ambient_payload['alert_id'],
        'source': 'AMBIENT',
        'type': type_map.get(ambient_payload['type'], 'GENERAL_SECURITY'),
        'title': f"{ambient_payload['type'].replace('_', ' ').title()} - {ambient_payload['location']}",
        'description': f"Ambient.AI detected {ambient_payload['type']} at {ambient_payload['location']}",
        'priority': severity_map.get(ambient_payload['severity'], 'medium'),
        'status': 'PENDING_APPROVAL',
        'location': ambient_payload['location'],
        'timestamp': ambient_payload['timestamp'],
        'confidence_score': ambient_payload.get('confidence', 0.0),
        'preview_url': ambient_payload.get('preview_url'),
        'deep_link_url': f"https://ambient.ai/alerts/{ambient_payload['alert_id']}",
        'metadata': {
            'ambient_metadata': ambient_payload.get('metadata', {}),
            'created_by': 'ambient_webhook',
            'requires_sop_evaluation': True
        },
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    return activity

def test_webhook_signature_validation():
    """Test webhook signature validation"""
    print("🧪 Testing webhook signature validation...")
    
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
    assert 'amb_123' in activity['deep_link_url'], "Deep link should contain alert ID"
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
    print("🚀 Starting Ambient Webhook Core Function Tests")
    print("=" * 60)
    
    try:
        test_webhook_signature_validation()
        test_payload_validation()
        test_activity_mapping()
        test_integration_scenarios()
        
        print("\n" + "=" * 60)
        print("🎉 ALL CORE FUNCTION TESTS PASSED!")
        print("✅ Webhook signature validation working")
        print("✅ Payload validation working")
        print("✅ Activity mapping working")
        print("✅ Integration scenarios working")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)