"""
Simple WebSocket Authorizer for Development/Testing
Allows both real Cognito tokens and test tokens
"""

import json
import os

def lambda_handler(event, context):
    """Main Lambda handler - simplified for testing"""
    print(f"Event: {json.dumps(event)}")
    
    # Get token from query string
    query_string_parameters = event.get('queryStringParameters', {})
    token = query_string_parameters.get('token') if query_string_parameters else None
    
    if not token:
        print("No token provided")
        raise Exception('Unauthorized')
    
    # For testing: Allow specific test tokens
    if token.startswith('test-'):
        # Extract test user info from token
        # Format: test-<email>-<role>
        parts = token.split('-')
        email = parts[1] if len(parts) > 1 else 'test@situ8.com'
        role = parts[2] if len(parts) > 2 else 'user'
        
        print(f"Test token accepted for {email}")
        
        return {
            'principalId': f'test-{email}',
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': event['methodArn']
                }]
            },
            'context': {
                'userId': f'test-{email}',
                'email': email,
                'role': role,
                'clearanceLevel': '3'
            }
        }
    
    # For production tokens, you'd verify the Cognito JWT here
    # For now, we'll just allow any non-test token as well
    print(f"Token accepted (dev mode)")
    
    return {
        'principalId': 'user-' + token[:10],
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': 'Allow',
                'Resource': event['methodArn']
            }]
        },
        'context': {
            'userId': 'user-' + token[:10],
            'email': 'user@situ8.com',
            'role': 'user',
            'clearanceLevel': '1'
        }
    }