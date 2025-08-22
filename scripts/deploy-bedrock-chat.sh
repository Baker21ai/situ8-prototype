#!/usr/bin/env bash
set -euo pipefail

# Deploy the Bedrock Chat Lambda and create/update API Gateway route /api/ai/chat
# Prereqs: AWS CLI configured, SAM or zip deploy path available

LAMBDA_NAME="situ8-bedrock-chat"
REGION="${AWS_REGION:-us-west-2}"
RUNTIME="python3.11"
ROLE_ARN="${BEDROCK_CHAT_LAMBDA_ROLE_ARN:-}"
ZIP_FILE="/tmp/bedrock-chat.zip"
HANDLER_DIR="lambdas/ai/bedrock-chat"
HANDLER_FILE="handler.py"
HANDLER="handler.lambda_handler"

if [[ -z "$ROLE_ARN" ]]; then
  echo "ERROR: Set BEDROCK_CHAT_LAMBDA_ROLE_ARN to an IAM role with bedrock:InvokeModel access" >&2
  exit 1
fi

rm -f "$ZIP_FILE"
(cd "$HANDLER_DIR" && zip -r "$ZIP_FILE" "$HANDLER_FILE" >/dev/null)

# Create or update function
if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION" >/dev/null
else
  aws lambda create-function \
    --function-name "$LAMBDA_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION" >/dev/null
fi

# Set environment variables
aws lambda update-function-configuration \
  --function-name "$LAMBDA_NAME" \
  --region "$REGION" \
  --environment "Variables={BEDROCK_REGION=$REGION,MODEL_ID=${MODEL_ID:-anthropic.claude-3-5-sonnet-20241022-v2:0}}" >/dev/null

echo "✅ Deployed $LAMBDA_NAME in $REGION. Now map it behind API Gateway to /api/ai/chat."
