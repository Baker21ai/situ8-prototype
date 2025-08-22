"""
Ambient.AI Webhook Receiver Lambda Function
Receives and processes webhooks from Ambient.AI with validation and security
"""

import json
import boto3
import os
import logging
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource('dynamodb')
eventbridge = boto3.client('events')
sqs = boto3.client('sqs')

# Environment variables
ACTIVITIES_TABLE = os.environ.get('ACTIVITIES_TABLE', 'situ8-activities')
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'situ8-events')
DLQ_URL = os.environ.get('DLQ_URL')
AMBIENT_API_KEY = os.environ.get('AMBIENT_API_KEY')
TENANT_ID = os.environ.get('TENANT_ID', 'default')

# Webhook signature validation
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

def validate_ambient_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate incoming Ambient webhook payload
    
    Expected format:
    {
        "alert_id": "string",
        "type": "tailgate|slip_fall|loitering|violence|...",
        "location": "building_a_lobby|zone_123|...",
        "timestamp": "2025-08-21T00:00:00Z",
        "severity": "low|medium|high|critical",
        "confidence": 0.85,
        "preview_url": "https://ambient.ai/preview/...",
        "metadata": {
            "camera_id": "cam_001",
            "zone": "restricted",
            "duration": 30
        }
    }
    """
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

def map_ambient_to_activity(ambient_payload: Dict[str, Any]) -> Dict[str, Any]:
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
    
    activity = {
        'id': f"ambient_{ambient_payload['alert_id']}",
        'tenant_id': TENANT_ID,
        'ambient_alert_id': ambient_payload['alert_id'],
        'source': 'AMBIENT',
        'type': type_map.get(ambient_payload['type'], 'GENERAL_SECURITY'),
        'title': f"{ambient_payload['type'].replace('_', ' ').title()} - {ambient_payload['location']}",
        'description': f"Ambient.AI detected {ambient_payload['type']} at {ambient_payload['location']}",
        'priority': severity_map.get(ambient_payload['severity'], 'medium'),
        'status': 'PENDING_APPROVAL',  # All Ambient alerts require human approval
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

def store_activity(activity: Dict[str, Any]) -> bool:
    """Store activity in DynamoDB"""
    try:
        table = dynamodb.Table(ACTIVITIES_TABLE)
        table.put_item(Item=activity)
        logger.info(f"Stored activity: {activity['id']}")
        return True
    except Exception as e:
        logger.error(f"Failed to store activity: {str(e)}")
        return False

def publish_to_eventbridge(activity: Dict[str, Any]) -> bool:
    """Publish activity to EventBridge for SOP processing"""
    try:
        event = {
            'Source': 'situ8.ambient.webhook',
            'DetailType': 'Activity Created',
            'Detail': json.dumps(activity),
            'EventBusName': EVENT_BUS_NAME
        }
        
        response = eventbridge.put_events(Entries=[event])
        
        if response['FailedEntryCount'] > 0:
            logger.error(f"EventBridge publish failed: {response['Entries']}")
            return False
            
        logger.info(f"Published activity to EventBridge: {activity['id']}")
        return True
    except Exception as e:
        logger.error(f"Failed to publish to EventBridge: {str(e)}")
        return False

def send_to_dlq(payload: Dict[str, Any], error: str) -> None:
    """Send failed payload to Dead Letter Queue"""
    if not DLQ_URL:
        logger.warning("No DLQ configured, skipping")
        return
    
    try:
        dlq_message = {
            'original_payload': payload,
            'error': error,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'function_name': 'ambient-webhook-receiver'
        }
        
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(dlq_message)
        )
        logger.info("Sent failed payload to DLQ")
    except Exception as e:
        logger.error(f"Failed to send to DLQ: {str(e)}")

def lambda_handler(event, context):
    """
    Main Lambda handler for Ambient webhook processing
    """
    try:
        # Extract request details
        body = event.get('body', '{}')
        headers = event.get('headers', {})
        
        # Parse JSON payload
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {str(e)}")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid JSON payload'})
            }
        
        # Validate webhook signature (if configured)
        signature = headers.get('x-ambient-signature')
        if AMBIENT_API_KEY and signature:
            if not validate_webhook_signature(body, signature, AMBIENT_API_KEY):
                logger.error("Invalid webhook signature")
                return {
                    'statusCode': 401,
                    'body': json.dumps({'error': 'Invalid signature'})
                }
        
        # Validate Ambient payload format
        try:
            validated_payload = validate_ambient_payload(payload)
        except ValueError as e:
            logger.error(f"Payload validation failed: {str(e)}")
            send_to_dlq(payload, str(e))
            return {
                'statusCode': 400,
                'body': json.dumps({'error': str(e)})
            }
        
        # Map to Situ8 Activity format
        activity = map_ambient_to_activity(validated_payload)
        
        # Store in DynamoDB
        storage_success = store_activity(activity)
        if not storage_success:
            send_to_dlq(payload, "Failed to store activity")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to store activity'})
            }
        
        # Publish to EventBridge for SOP processing
        publish_success = publish_to_eventbridge(activity)
        if not publish_success:
            logger.warning("Failed to publish to EventBridge, but activity stored")
        
        # Success response
        response_body = {
            'status': 'success',
            'activity_id': activity['id'],
            'message': 'Webhook processed successfully'
        }
        
        logger.info(f"Successfully processed webhook for alert: {payload['alert_id']}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        
        # Send to DLQ if we have the payload
        if 'payload' in locals():
            send_to_dlq(payload, f"Unexpected error: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }