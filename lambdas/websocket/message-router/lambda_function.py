"""
WebSocket Message Router Lambda
Routes messages between connected clients and saves to DynamoDB
"""

import json
import boto3
import os
from datetime import datetime
import uuid
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'situ8-websocket-connections'))
messages_table = dynamodb.Table(os.environ.get('MESSAGES_TABLE', 'situ8-communication-messages'))
channels_table = dynamodb.Table(os.environ.get('CHANNELS_TABLE', 'situ8-communication-channels'))

# API Gateway management API
api_gateway = boto3.client('apigatewaymanagementapi',
    endpoint_url=os.environ.get('WEBSOCKET_ENDPOINT', 'https://8hj9sdifek.execute-api.us-west-2.amazonaws.com/dev')
)

def lambda_handler(event, context):
    """
    Handles WebSocket $default route
    Routes messages to appropriate handlers
    """
    connection_id = event['requestContext']['connectionId']
    
    try:
        # Parse the message body
        body = json.loads(event['body'])
        action = body.get('action', 'message')
        
        # Route based on action
        if action == 'message':
            return handle_message(connection_id, body)
        elif action == 'join':
            return handle_join_channel(connection_id, body)
        elif action == 'leave':
            return handle_leave_channel(connection_id, body)
        elif action == 'typing':
            return handle_typing_indicator(connection_id, body)
        elif action == 'ping':
            return handle_ping(connection_id)
        elif action == 'load_more_messages':
            return handle_load_more_messages(connection_id, body)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Unknown action: {action}'})
            }
            
    except Exception as e:
        print(f"Error handling message: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to process message'})
        }

def handle_message(connection_id, body):
    """
    Handle sending a message to a channel
    """
    # Get sender info from connections table
    sender_info = get_connection_info(connection_id)
    if not sender_info:
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Connection not found'})
        }
    
    # Extract message details
    channel_id = body.get('channelId', sender_info.get('channelId', 'main'))
    content = body.get('content', '')
    message_type = body.get('type', 'text')
    metadata = body.get('metadata', {})
    
    # Create message record
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    message = {
        'messageId': message_id,
        'channelId': channel_id,
        'senderId': sender_info.get('userId', 'unknown'),
        'senderEmail': sender_info.get('userEmail', 'unknown'),
        'senderRole': sender_info.get('userRole', 'user'),
        'content': content,
        'type': message_type,
        'timestamp': timestamp,
        'metadata': metadata
    }
    
    # Save message to DynamoDB
    try:
        messages_table.put_item(Item=message)
    except Exception as e:
        print(f"Error saving message: {str(e)}")
    
    # Get all connections in the channel
    channel_connections = get_channel_connections(channel_id)
    
    # Broadcast message to all connections in the channel
    broadcast_response = {
        'action': 'message',
        'message': message
    }
    
    failed_connections = []
    for conn in channel_connections:
        conn_id = conn['connectionId']
        try:
            api_gateway.post_to_connection(
                ConnectionId=conn_id,
                Data=json.dumps(broadcast_response)
            )
        except api_gateway.exceptions.GoneException:
            # Connection is stale, remove it
            failed_connections.append(conn_id)
        except Exception as e:
            print(f"Error sending to connection {conn_id}: {str(e)}")
    
    # Clean up stale connections
    for conn_id in failed_connections:
        try:
            connections_table.delete_item(Key={'connectionId': conn_id})
        except:
            pass
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Message sent', 'messageId': message_id})
    }

def handle_join_channel(connection_id, body):
    """
    Handle joining a channel
    """
    channel_id = body.get('channelId', 'main')
    
    # Update connection's channel
    try:
        connections_table.update_item(
            Key={'connectionId': connection_id},
            UpdateExpression='SET channelId = :channel, lastActivity = :time',
            ExpressionAttributeValues={
                ':channel': channel_id,
                ':time': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f"Error updating connection channel: {str(e)}")
    
    # Notify channel members
    sender_info = get_connection_info(connection_id)
    broadcast_to_channel(channel_id, {
        'action': 'user_joined',
        'userId': sender_info.get('userId'),
        'userEmail': sender_info.get('userEmail'),
        'channelId': channel_id
    }, exclude_connection=connection_id)
    
    # Send recent messages to the joining user
    message_history = get_recent_messages(channel_id, limit=50)
    try:
        api_gateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'action': 'message_history',
                'messages': message_history['messages'],
                'hasMore': message_history['hasMore'],
                'lastEvaluatedKey': message_history['lastEvaluatedKey'],
                'channelId': channel_id
            })
        )
    except Exception as e:
        print(f"Error sending message history: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': f'Joined channel {channel_id}'})
    }

def handle_leave_channel(connection_id, body):
    """
    Handle leaving a channel
    """
    channel_id = body.get('channelId', 'main')
    
    # Notify channel members
    sender_info = get_connection_info(connection_id)
    broadcast_to_channel(channel_id, {
        'action': 'user_left',
        'userId': sender_info.get('userId'),
        'userEmail': sender_info.get('userEmail'),
        'channelId': channel_id
    }, exclude_connection=connection_id)
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': f'Left channel {channel_id}'})
    }

def handle_typing_indicator(connection_id, body):
    """
    Handle typing indicator
    """
    channel_id = body.get('channelId', 'main')
    is_typing = body.get('isTyping', False)
    
    sender_info = get_connection_info(connection_id)
    
    broadcast_to_channel(channel_id, {
        'action': 'typing',
        'userId': sender_info.get('userId'),
        'userEmail': sender_info.get('userEmail'),
        'isTyping': is_typing
    }, exclude_connection=connection_id)
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Typing indicator sent'})
    }

def handle_ping(connection_id):
    """
    Handle ping/keepalive
    """
    # Update last activity
    try:
        connections_table.update_item(
            Key={'connectionId': connection_id},
            UpdateExpression='SET lastActivity = :time',
            ExpressionAttributeValues={
                ':time': datetime.utcnow().isoformat()
            }
        )
    except:
        pass
    
    # Send pong response
    api_gateway.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps({'action': 'pong', 'timestamp': datetime.utcnow().isoformat()})
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Pong'})
    }

def handle_load_more_messages(connection_id, body):
    """
    Handle loading more message history with pagination
    """
    channel_id = body.get('channelId', 'main')
    limit = body.get('limit', 50)
    # Support both 'cursor' (from frontend) and 'lastEvaluatedKey' (internal)
    last_evaluated_key = body.get('cursor') or body.get('lastEvaluatedKey')
    
    # Verify user has access to the channel
    sender_info = get_connection_info(connection_id)
    if not sender_info:
        return {
            'statusCode': 401,
            'body': json.dumps({'error': 'Connection not found'})
        }
    
    # Load message history with pagination
    message_history = get_recent_messages(channel_id, limit, last_evaluated_key)
    
    try:
        api_gateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'action': 'message_history_batch',
                'messages': message_history['messages'],
                'hasMore': message_history['hasMore'],
                'lastEvaluatedKey': message_history['lastEvaluatedKey'],
                'channelId': channel_id
            })
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': f'Loaded {len(message_history["messages"])} messages'})
        }
    except Exception as e:
        print(f"Error sending message history batch: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to load messages'})
        }

def get_connection_info(connection_id):
    """
    Get connection info from DynamoDB
    """
    try:
        response = connections_table.get_item(Key={'connectionId': connection_id})
        return response.get('Item')
    except:
        return None

def get_channel_connections(channel_id):
    """
    Get all connections in a channel
    """
    try:
        response = connections_table.scan(
            FilterExpression='channelId = :channel',
            ExpressionAttributeValues={':channel': channel_id}
        )
        return response.get('Items', [])
    except:
        return []

def get_recent_messages(channel_id, limit=50, last_evaluated_key=None):
    """
    Get recent messages from a channel with pagination support
    """
    try:
        query_params = {
            'KeyConditionExpression': 'channelId = :channel',
            'ExpressionAttributeValues': {':channel': channel_id},
            'Limit': limit,
            'ScanIndexForward': False  # Most recent first
        }
        
        # Add pagination cursor if provided
        if last_evaluated_key:
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        response = messages_table.query(**query_params)
        messages = response.get('Items', [])
        
        # Convert Decimal types to float for JSON serialization
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            return obj
        
        # Clean up the messages for JSON serialization
        cleaned_messages = []
        for msg in messages:
            cleaned_msg = {}
            for key, value in msg.items():
                if isinstance(value, Decimal):
                    cleaned_msg[key] = float(value)
                else:
                    cleaned_msg[key] = value
            cleaned_messages.append(cleaned_msg)
        
        # Reverse to get chronological order
        chronological_messages = list(reversed(cleaned_messages))
        
        return {
            'messages': chronological_messages,
            'hasMore': 'LastEvaluatedKey' in response,
            'lastEvaluatedKey': response.get('LastEvaluatedKey')
        }
    except Exception as e:
        print(f"Error getting messages: {str(e)}")
        return {'messages': [], 'hasMore': False, 'lastEvaluatedKey': None}

def broadcast_to_channel(channel_id, message, exclude_connection=None):
    """
    Broadcast a message to all connections in a channel
    """
    connections = get_channel_connections(channel_id)
    
    for conn in connections:
        conn_id = conn['connectionId']
        if conn_id == exclude_connection:
            continue
            
        try:
            api_gateway.post_to_connection(
                ConnectionId=conn_id,
                Data=json.dumps(message)
            )
        except api_gateway.exceptions.GoneException:
            # Connection is stale, remove it
            try:
                connections_table.delete_item(Key={'connectionId': conn_id})
            except:
                pass
        except Exception as e:
            print(f"Error broadcasting to {conn_id}: {str(e)}")