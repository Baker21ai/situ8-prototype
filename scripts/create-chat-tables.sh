#\!/bin/bash

# Create DynamoDB tables for chat functionality

echo "Creating chat conversations table..."
aws dynamodb create-table \
  --table-name situ8-chat-conversations \
  --attribute-definitions \
    AttributeName=conversationId,AttributeType=S \
  --key-schema \
    AttributeName=conversationId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2

echo "Creating chat messages table..."
aws dynamodb create-table \
  --table-name situ8-chat-messages \
  --attribute-definitions \
    AttributeName=conversationId,AttributeType=S \
    AttributeName=messageId,AttributeType=S \
  --key-schema \
    AttributeName=conversationId,KeyType=HASH \
    AttributeName=messageId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2

echo "Chat tables created successfully\!"
