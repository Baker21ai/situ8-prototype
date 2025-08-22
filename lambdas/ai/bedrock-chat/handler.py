import os
import json
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

BEDROCK_REGION = os.environ.get('BEDROCK_REGION', os.environ.get('AWS_REGION', 'us-west-2'))
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')

bedrock = boto3.client('bedrock-runtime', region_name=BEDROCK_REGION, config=Config(retries={'max_attempts': 3}))


def respond(status_code: int, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        },
        'body': json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        if event.get('httpMethod') == 'OPTIONS':
            return respond(200, {'ok': True})

        body = event.get('body') or '{}'
        if event.get('isBase64Encoded'):
            import base64
            body = base64.b64decode(body).decode('utf-8')
        payload = json.loads(body)

        messages = payload.get('messages', [])
        model_id = payload.get('modelId') or MODEL_ID
        temperature = float(payload.get('temperature', 0.3))
        max_tokens = int(payload.get('maxTokens', 800))

        # Convert messages to Anthropic-style for Bedrock
        # Expect: [{role:'user'|'assistant'|'system', content:'...'}]
        system_prompt = ''
        convo = []
        for m in messages:
            role = m.get('role')
            content = m.get('content', '')
            if role == 'system':
                system_prompt += content + '\n'
            else:
                convo.append({'role': role, 'content': [{'type': 'text', 'text': content}]})

        request_body = {
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': max_tokens,
            'temperature': temperature,
            'messages': convo
        }
        if system_prompt:
            request_body['system'] = system_prompt.strip()

        # NOTE: Fallback logic removed per request. Keeping a single invocation.
        # Previous fallback implementation commented out intentionally.
        #
        # result = bedrock.invoke_model(... with fallback candidates ...)
        # ...
        # return respond(200, { 'success': True, 'reply': reply_text, 'metadata': {...} })

        # Single model invocation
        result = bedrock.invoke_model(
            modelId=model_id,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )

        response_body = json.loads(result['body'].read())
        reply_text = ''
        for c in response_body.get('content', []):
            if c.get('type') == 'text':
                reply_text += c.get('text', '')

        return respond(200, {
            'success': True,
            'reply': reply_text,
            'metadata': {
                'modelId': model_id,
                'region': BEDROCK_REGION
            }
        })

    except Exception as e:
        return respond(500, { 'success': False, 'error': str(e) })
