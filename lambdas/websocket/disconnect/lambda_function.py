"""
WebSocket Disconnection Handler Lambda
Handles WebSocket disconnections and cleans up DynamoDB
"""

import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'situ8-websocket-connections'))

def lambda_handler(event, context):
    """
    Handles WebSocket $disconnect route
    Removes connection from DynamoDB
    """
    connection_id = event['requestContext']['connectionId']
    
    try:
        # Remove connection from DynamoDB
        connections_table.delete_item(
            Key={'connectionId': connection_id}
        )
        
        print(f"Connection removed: {connection_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Disconnected successfully'
            })
        }
        
    except Exception as e:
        print(f"Error removing connection: {str(e)}")
        # Return 200 anyway to prevent API Gateway errors
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Disconnection processed'})
        }