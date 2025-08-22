"""
WebSocket Connection Handler Lambda
Handles new WebSocket connections and stores them in DynamoDB
"""

import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'situ8-websocket-connections'))

def lambda_handler(event, context):
    """
    Handles WebSocket $connect route
    Stores connection info in DynamoDB
    """
    connection_id = event['requestContext']['connectionId']
    
    # Extract user info from authorizer context (if available)
    authorizer = event.get('requestContext', {}).get('authorizer', {})
    user_id = authorizer.get('userId', 'anonymous')
    user_email = authorizer.get('email', 'unknown')
    user_role = authorizer.get('role', 'user')
    
    # Get query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    channel_id = query_params.get('channel', 'main')
    
    try:
        # Store connection in DynamoDB
        connections_table.put_item(
            Item={
                'connectionId': connection_id,
                'userId': user_id,
                'userEmail': user_email,
                'userRole': user_role,
                'channelId': channel_id,
                'connectedAt': datetime.utcnow().isoformat(),
                'lastActivity': datetime.utcnow().isoformat(),
                'status': 'connected'
            }
        )
        
        print(f"Connection stored: {connection_id} for user {user_email}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Connected successfully',
                'connectionId': connection_id
            })
        }
        
    except Exception as e:
        print(f"Error storing connection: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to connect'})
        }