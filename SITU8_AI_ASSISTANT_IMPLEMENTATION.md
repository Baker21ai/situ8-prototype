# Situ8 AI Assistant Implementation Guide

> **Last Updated:** July 30, 2025  
> **Status:** Planning Phase  
> **Authors:** Situ8 Engineering Team

## Executive Summary

This document outlines two implementation approaches for the Situ8 AI Assistant:

1. **v0/MVP Approach** - Fast deployment using Supabase + Vercel AI SDK (2-3 weeks)
2. **v1/Production Approach** - Enterprise-grade AWS Bedrock implementation (6-8 weeks)

### Quick Comparison

| Aspect | v0 (Supabase + Vercel) | v1 (AWS Bedrock) |
|--------|------------------------|------------------|
| **Time to Market** | 2-3 weeks | 6-8 weeks |
| **Compliance** | Basic SOC 2 | Full SOC 2-T2, HIPAA-eligible |
| **Cost** | ~$200-500/month | ~$2000-5000/month |
| **Scalability** | Good (1000s users) | Excellent (100k+ users) |
| **Data Residency** | Supabase regions | Full control in AWS |
| **AI Models** | OpenAI/Anthropic via API | AWS Bedrock (Claude, Llama) |

---

## Part 1: v0/MVP Implementation (Ship Fast)

### Overview

A proof-of-concept AI assistant that can:
- Chat with security operators
- Create incidents and activities via natural language
- Display created items in the activity timeline
- Maintain basic compliance and audit trails

### Tech Stack

```typescript
// Core Dependencies
{
  "dependencies": {
    "ai": "^3.2",                    // Vercel AI SDK
    "@supabase/supabase-js": "^2.x", // Existing DB
    "zod": "^3.x",                   // Schema validation
    "nanoid": "^5.x",                // ID generation
    "@langchain/core": "^0.2.x"      // Advanced patterns
  }
}
```

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Vercel AI  │────▶│  OpenAI/    │
│   Frontend  │     │    SDK      │     │  Anthropic  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│  Supabase   │     │   Vercel    │
│  Database   │     │   KV Store  │
└─────────────┘     └─────────────┘
```

### Implementation Steps

#### Step 1: API Route Setup (Day 1-2)

Create `/app/api/ai/chat/route.ts`:

```typescript
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Define tools/functions
const tools = {
  createIncident: {
    description: 'Create a new security incident',
    parameters: z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      location: z.string(),
      assignedGuards: z.array(z.string()).optional(),
    }),
    execute: async (params) => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      
      // Create incident following business logic
      const incident = await supabase
        .from('incidents')
        .insert({
          ...params,
          status: 'open',
          created_by: 'ai_assistant',
          audit_trail: [{
            action: 'created',
            by: 'ai_assistant',
            timestamp: new Date().toISOString()
          }]
        })
        .select()
        .single();
        
      // Create activity for timeline
      await supabase
        .from('activities')
        .insert({
          type: 'incident-created',
          title: `Incident Created: ${params.title}`,
          entity_id: incident.data.id,
          entity_type: 'incident',
          metadata: params
        });
        
      return incident.data;
    }
  },
  
  createActivity: {
    description: 'Log a new security activity',
    parameters: z.object({
      type: z.enum(['patrol', 'alert', 'observation', 'medical', 'property-damage']),
      description: z.string(),
      location: z.string(),
      mediaUrls: z.array(z.string()).optional(),
    }),
    execute: async (params) => {
      // Similar implementation
    }
  },
  
  searchIncidents: {
    description: 'Search for incidents by criteria',
    parameters: z.object({
      status: z.enum(['open', 'in-progress', 'resolved']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional(),
    }),
    execute: async (params) => {
      // Query implementation
    }
  }
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Get user context from auth
  const user = await getUserFromRequest(req);
  
  // Call AI with tools
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a security operations assistant for Situ8. 
        You help security personnel manage incidents, activities, and operations.
        Current user: ${user.role} at ${user.organization}.
        Always confirm critical actions before executing.`
      },
      ...messages
    ],
    tools: Object.entries(tools).map(([name, tool]) => ({
      type: 'function',
      function: {
        name,
        description: tool.description,
        parameters: tool.parameters,
      }
    })),
    stream: true,
  });
  
  // Handle streaming with function calls
  const stream = OpenAIStream(response, {
    experimental_onToolCall: async (call) => {
      const tool = tools[call.function.name];
      if (!tool) throw new Error(`Unknown tool: ${call.function.name}`);
      
      // Validate permissions
      if (!canUserExecuteTool(user, call.function.name)) {
        return {
          error: 'Permission denied for this action'
        };
      }
      
      // Execute tool
      const result = await tool.execute(call.function.arguments);
      
      // Log audit event
      await logAuditEvent({
        user_id: user.id,
        action: `ai_tool_${call.function.name}`,
        parameters: call.function.arguments,
        result,
      });
      
      return result;
    },
  });
  
  return new StreamingTextResponse(stream);
}
```

#### Step 2: Chat UI Component (Day 3-4)

Create `/components/ai/ChatPanel.tsx`:

```tsx
'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, User, Loader2 } from 'lucide-react';
import { useActivityStore } from '@/stores/activityStore';
import { useIncidentStore } from '@/stores/incidentStore';

export function ChatPanel() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    onFinish: (message) => {
      // Refresh stores if AI created something
      if (message.tool_calls?.length) {
        useActivityStore.getState().fetchActivities();
        useIncidentStore.getState().fetchIncidents();
      }
    },
  });
  
  return (
    <Card className="flex flex-col h-[600px] w-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">AI Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Ask me to create incidents, log activities, or search records
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'assistant' ? '' : 'flex-row-reverse'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              
              <div className={`flex-1 ${
                message.role === 'assistant' ? '' : 'text-right'
              }`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-muted'
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {message.content}
                  
                  {/* Show tool calls */}
                  {message.tool_calls?.map((call) => (
                    <div key={call.id} className="mt-2 p-2 bg-background/50 rounded text-xs">
                      <span className="font-mono">
                        {call.function.name}({JSON.stringify(call.function.arguments, null, 2)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Create an incident for suspicious activity in Building A..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

#### Step 3: Integration with Existing Stores (Day 5-6)

Update stores to handle AI-created entities:

```typescript
// In activityStore.ts
interface Activity {
  // ... existing fields
  created_by: 'user' | 'ai_assistant' | 'system';
  ai_metadata?: {
    conversation_id: string;
    prompt: string;
    model: string;
  };
}

// Add method to create activity from AI
createFromAI: async (params: CreateActivityParams, aiMetadata: AIMetadata) => {
  const activity = await supabase
    .from('activities')
    .insert({
      ...params,
      created_by: 'ai_assistant',
      ai_metadata: aiMetadata,
    })
    .select()
    .single();
    
  // Update local state
  set((state) => ({
    activities: [activity.data, ...state.activities],
  }));
  
  // Trigger real-time update
  broadcast('activity:created', activity.data);
  
  return activity.data;
};
```

#### Step 4: Permissions & Human-in-the-Loop (Day 7-8)

Add confirmation dialogs for critical actions:

```tsx
// components/ai/ActionConfirmDialog.tsx
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActionConfirmDialogProps {
  action: string;
  parameters: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionConfirmDialog({
  action,
  parameters,
  onConfirm,
  onCancel,
}: ActionConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const criticalActions = ['assignGuards', 'closeIncident', 'escalateToPolice'];
  const requiresConfirmation = criticalActions.includes(action);
  
  if (!requiresConfirmation) {
    onConfirm();
    return null;
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm AI Action</AlertDialogTitle>
          <AlertDialogDescription>
            The AI assistant wants to perform the following action:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4 p-4 bg-muted rounded-lg">
          <p className="font-mono text-sm">{action}</p>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(parameters, null, 2)}
          </pre>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm & Execute
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### v0 Security Considerations

1. **API Key Management**
   ```env
   # .env.local
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Rate Limiting**
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';
   
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
   });
   ```

3. **Audit Logging**
   ```typescript
   // Every AI action logged to Supabase
   const audit_logs = {
     id: 'uuid',
     user_id: 'string',
     action: 'ai_create_incident',
     parameters: 'jsonb',
     result: 'jsonb',
     timestamp: 'timestamptz',
     ip_address: 'inet',
   };
   ```

### v0 Deployment Timeline

- **Week 1**: Basic chat interface + create incident tool
- **Week 2**: All tools implemented + permissions
- **Week 3**: Testing, security review, deploy to staging

---

## Part 2: v1/Production Implementation (AWS Bedrock)

### Overview

Enterprise-grade implementation with full compliance, better performance, and complete data control.

### Complete AWS Bedrock Specification

> **Purpose:** Provide a complete, implementation‑ready specification that Situ8 engineers can follow to ship a compliant chat‑style AI assistant backed by **AWS Bedrock + Guardrails**.

#### Goals & Non‑Goals

|                         | Goal                                                  | Non‑Goal                      |
| ----------------------- | ----------------------------------------------------- | ----------------------------- |
| **Compliance envelope** | SOC 2‑T2, HIPAA‑eligible, GDPR, tenant data isolation | Formal FedRAMP High (phase 2) |
| **Latency**             | P95 ≤ 250 ms round‑trip for West US users             | Sub‑80 ms worldwide           |
| **Models**              | Claude‑3 Sonnet (default), Llama‑3‑70B (long docs)    | Fine‑tuning / custom RLHF     |
| **Security**            | All traffic in VPC, CloudTrail logs, KMS at rest      | Self‑hosted GPU inference     |
| **UX**                  | Streaming chat UI, command‑palette, typing indicator  | Voice or multimodal (phase 3) |

#### High‑Level Architecture

```
Browser
│  (SSE/WebSocket)
└──► Next.js API route /api/ai/assistant  ──►  AWS ALB  ──►  App Runner «assistant‑proxy»
                                             │                     │
                                             │             CloudWatch Logs
                                             │                     │
                                             ▼                     ▼
                                      Bedrock Invoke  ◄── Guardrails (PII, policy)
                                             │
                           ┌────────Retrieve & RAG────────┐
                           │  pgvector  │  OpenSearch KNN │
                           └──────────────────────────────┘
                                            
All resources in *us‑west‑2*, private subnets, NAT‑less.  CloudTrail + S3 ObjectLock log every request/response pair.
```

#### Component Detail

##### Front‑end (Next.js 15 + shadcn/ui)

| Element       | Library                                      | Notes                                      |
| ------------- | -------------------------------------------- | ------------------------------------------ |
| `<ChatPanel>` | shadcn `<ScrollArea>` + `<Card>`             | Streams tokens via EventSource             |
| `<ChatInput>` | shadcn `<Textarea>`                          | Cmd+Enter submit, disabled while streaming |
| Typing dots   | `<Skeleton class="animate-pulse h-4 w-12"/>` | Replace on final token                     |
| Command‑K     | `cmdk` + function‑calling                    | Quick actions                              |

##### API Proxy (App Runner container)

* **Language**: Go 1.22 (fast SSE streaming)
* **Endpoints**:
  * `POST /chat` → JSON body `{messages:[{role,user|assistant,content}], model}`
  * `GET  /stream` → query `conversation_id`
* **Responsibility**:
  1. JWT auth (Cognito) → tenant ID
  2. Policy check (`role in [operator,admin]`)
  3. Assemble Bedrock payload; route to `claude-3-sonnet` unless `token_count>10k` → `llama-3-70b`
  4. Attach Guardrail ID
  5. Stream chunks back → convert to Server‑Sent Events (text/event‑stream)
  6. Emit audit record `{uid,ts,tenant,model,tokens_in,tokens_out}` → Kinesis Firehose → S3

##### Function Calling Implementation

```go
// proxy/functions.go
package main

import (
    "encoding/json"
    "github.com/aws/aws-sdk-go-v2/service/bedrock"
)

type Function struct {
    Name        string                 `json:"name"`
    Description string                 `json:"description"`
    Parameters  json.RawMessage        `json:"parameters"`
    Handler     func(args interface{}) (interface{}, error)
}

var SecurityFunctions = []Function{
    {
        Name:        "createIncident",
        Description: "Create a new security incident",
        Parameters:  json.RawMessage(`{
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
                "location": {"type": "string"}
            },
            "required": ["title", "description", "priority"]
        }`),
        Handler: handleCreateIncident,
    },
    {
        Name:        "createActivity",
        Description: "Log a security activity",
        Parameters:  json.RawMessage(`{
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["patrol", "alert", "medical", "property-damage"]},
                "description": {"type": "string"},
                "location": {"type": "string"}
            },
            "required": ["type", "description"]
        }`),
        Handler: handleCreateActivity,
    },
}

func handleCreateIncident(args interface{}) (interface{}, error) {
    // Validate args
    // Check permissions
    // Call Supabase API
    // Log audit event
    // Return result
}
```

##### Retrieval Layer (optional phase 1.5)

* **Store:** Supabase Postgres + `pgvector` ext (tenant‑scoped)
* **Indexer:** Rust worker on SQS; splits PDF/docx → chunks → embeds using Bedrock Titan Text‑Embeddings v2
* **Query:** Proxy performs similarity search (`<100ms`), prepends context

##### Guardrails Policy (JSON)

```json
{
  "name": "situ8-assistant-guardrail",
  "description": "Security and compliance guardrail for Situ8 AI assistant",
  "topicPolicyConfig": {
    "topicsConfig": [
      {
        "name": "RestrictedOperations",
        "definition": "Operations that require human approval",
        "examples": [
          "Dispatch armed guards",
          "Contact law enforcement",
          "Evacuate building"
        ],
        "type": "DENY"
      }
    ]
  },
  "contentPolicyConfig": {
    "filtersConfig": [
      {
        "type": "SEXUAL",
        "inputStrength": "HIGH",
        "outputStrength": "HIGH"
      },
      {
        "type": "VIOLENCE",
        "inputStrength": "MEDIUM",
        "outputStrength": "HIGH"
      }
    ]
  },
  "sensitiveInformationPolicyConfig": {
    "piiEntitiesConfig": [
      {
        "type": "US_SOCIAL_SECURITY_NUMBER",
        "action": "BLOCK"
      },
      {
        "type": "CREDIT_DEBIT_CARD_NUMBER",
        "action": "BLOCK"
      }
    ]
  },
  "blockedInputMessaging": "I cannot process this request due to security policies.",
  "blockedOutputsMessaging": "I cannot provide this information due to security policies."
}
```

#### Terraform Implementation

```hcl
# terraform/modules/ai-assistant/main.tf

module "assistant_vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  
  name    = "situ8-assistant"
  cidr    = "10.42.0.0/16"
  
  azs             = ["us-west-2a", "us-west-2b"]
  private_subnets = ["10.42.1.0/24", "10.42.2.0/24"]
  
  enable_nat_gateway = false
  enable_vpn_gateway = false
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_bedrock_guardrail" "assistant" {
  name                      = "situ8-assistant-guardrail"
  blocked_input_messaging   = "I cannot process this request due to security policies."
  blocked_outputs_messaging = "I cannot provide this information due to security policies."
  description              = "Guardrail for Situ8 AI Assistant"
  
  content_policy_config {
    filters_config {
      input_strength  = "HIGH"
      output_strength = "HIGH"
      type           = "SEXUAL"
    }
    
    filters_config {
      input_strength  = "MEDIUM"
      output_strength = "HIGH"
      type           = "VIOLENCE"
    }
  }
  
  sensitive_information_policy_config {
    pii_entities_config {
      action = "BLOCK"
      type   = "US_SOCIAL_SECURITY_NUMBER"
    }
    
    pii_entities_config {
      action = "BLOCK"
      type   = "CREDIT_DEBIT_CARD_NUMBER"
    }
  }
  
  topic_policy_config {
    topics_config {
      name       = "RestrictedOperations"
      type       = "DENY"
      definition = "Operations requiring human approval"
      examples   = [
        "Dispatch armed guards",
        "Contact law enforcement",
        "Evacuate building"
      ]
    }
  }
}

resource "aws_apprunner_service" "assistant_proxy" {
  service_name = "situ8-assistant-proxy"
  
  source_configuration {
    authentication_configuration {
      connection_arn = aws_apprunner_connection.github.arn
    }
    
    code_repository {
      repository_url = var.github_repository_url
      source_code_version {
        type  = "BRANCH"
        value = var.github_branch
      }
      
      code_configuration {
        configuration_source = "API"
        
        code_configuration_values {
          runtime = "GO_1"
          port    = "8080"
          
          runtime_environment_variables = {
            BEDROCK_REGION     = var.aws_region
            GUARDRAIL_ID       = aws_bedrock_guardrail.assistant.id
            SUPABASE_URL       = var.supabase_url
            SUPABASE_SERVICE_KEY = aws_secretsmanager_secret_version.supabase_key.secret_string
          }
        }
      }
    }
  }
  
  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.assistant.arn
    }
  }
  
  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }
  
  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.assistant.arn
}

resource "aws_apprunner_auto_scaling_configuration_version" "assistant" {
  auto_scaling_configuration_name = "situ8-assistant-scaling"
  
  max_concurrency = 100
  max_size        = 10
  min_size        = 1
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "assistant_audit" {
  name                          = "situ8-assistant-audit"
  s3_bucket_name               = aws_s3_bucket.audit_logs.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::Bedrock::*"
      values = ["arn:aws:bedrock:*"]
    }
  }
  
  advanced_event_selector {
    name = "Log all Bedrock API calls"
    
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
    
    field_selector {
      field  = "resources.type"
      equals = ["AWS::Bedrock::Model"]
    }
  }
}

# S3 bucket for audit logs with object lock
resource "aws_s3_bucket" "audit_logs" {
  bucket = "situ8-assistant-audit-logs-${var.environment}"
  
  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  
  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 2555 # 7 years
    }
  }
}

# KMS key for encryption
resource "aws_kms_key" "assistant" {
  description             = "KMS key for Situ8 AI Assistant"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "situ8-assistant-kms"
    Environment = var.environment
  }
}

# IAM role for App Runner
resource "aws_iam_role" "apprunner_bedrock" {
  name = "situ8-assistant-apprunner-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "apprunner_bedrock" {
  name = "bedrock-access"
  role = aws_iam_role.apprunner_bedrock.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/meta.llama3-70b-instruct-v1:0"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:ApplyGuardrail"
        ]
        Resource = aws_bedrock_guardrail.assistant.arn
      }
    ]
  })
}

# Monitoring and Alerting
resource "aws_cloudwatch_metric_alarm" "latency" {
  alarm_name          = "situ8-assistant-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestLatency"
  namespace           = "AWS/AppRunner"
  period              = "300"
  statistic           = "Average"
  threshold           = "400"
  alarm_description   = "This metric monitors API latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ServiceName = aws_apprunner_service.assistant_proxy.service_name
  }
}

resource "aws_cloudwatch_metric_alarm" "guardrail_blocks" {
  alarm_name          = "situ8-assistant-guardrail-blocks"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "GuardrailBlockedRequests"
  namespace           = "AWS/Bedrock"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Guardrail is blocking requests"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

#### Step‑by‑Step Implementation Plan

1. **Legal (Week 1)**
   * Sign AWS **Business Associate Addendum** + DPA
   * Review Bedrock service terms
   * Confirm data residency requirements

2. **Infrastructure Bootstrap (Week 1-2)**
   ```bash
   cd terraform
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

3. **Guardrails Configuration (Week 2)**
   * Review and customize guardrail policy
   * Test with sample prompts
   * Document blocked scenarios

4. **Proxy Service Development (Week 2-3)**
   ```bash
   cd proxy
   go mod init github.com/situ8/assistant-proxy
   go get github.com/aws/aws-sdk-go-v2/service/bedrock
   go get github.com/gorilla/mux
   make build
   make test
   make docker-push
   ```

5. **Frontend Integration (Week 3-4)**
   * Implement streaming chat UI
   * Add function calling support
   * Create activity/incident display

6. **Security Review (Week 4-5)**
   * Run security scanner
   * Penetration testing
   * Review IAM permissions

7. **Compliance Documentation (Week 5-6)**
   * Generate SOC 2 evidence
   * Document data flows
   * Create runbooks

8. **Load Testing (Week 6)**
   ```bash
   # Using k6
   k6 run --vus 100 --duration 30s load-test.js
   ```

9. **Staged Rollout (Week 6-8)**
   * Internal testing (1 week)
   * Beta customers (1 week)
   * General availability

#### Acceptance Criteria

- **AC‑01** Chat UI streams first token < 1 s for 95% of requests in us‑west‑2
- **AC‑02** CloudTrail contains <prompt,model,uid> for 100% of calls
- **AC‑03** Guardrail blocks "SSN 123‑45‑6789" test string
- **AC‑04** Audit doc bundle (SOC 2 report, BAA, DPA) exported to Trust Center
- **AC‑05** All Terraform resources tagged with Environment and ManagedBy
- **AC‑06** Function calling creates incidents/activities with proper audit trail
- **AC‑07** 99.9% uptime over 30-day period

---

## Part 3: Integration with Situ8 Business Logic

### Activity Creation Flow

```typescript
// When AI creates an activity
1. AI receives prompt: "Log a medical emergency in Building A"
2. AI calls createActivity function with parameters
3. Function validates against business rules:
   - Required fields present
   - Valid activity type
   - Location exists in system
4. Create activity in database with AI metadata
5. Broadcast to real-time subscribers
6. Update activity timeline
7. Return confirmation to AI
8. AI responds to user with details
```

### Incident Management Flow

```typescript
// When AI creates an incident
1. AI receives prompt: "Create high priority incident for fire alarm"
2. AI suggests incident parameters
3. If guards need assignment → require human confirmation
4. Create incident following state machine:
   - Status: 'open'
   - Audit trail includes AI creation
5. Group related activities automatically
6. Notify relevant personnel
7. Display in incident panel
```

### Display Integration

The AI-created items will appear in:

1. **Activity Timeline** (`/components/Activities.tsx`)
   - Show AI icon for AI-created items
   - Include conversation reference

2. **Incident Panel** (`/components/CommandCenter.tsx`)
   - Real-time updates when AI creates incidents
   - Show AI assistant context

3. **Audit Trail**
   - Complete record of AI actions
   - Searchable by conversation ID

---

## Part 4: Decision Matrix

### When to Use v0 (Supabase + Vercel)

✅ **Choose v0 if:**
- Need to ship in < 1 month
- Have < 1000 daily active users
- Basic compliance is sufficient
- Want to test AI features quickly
- Budget < $1000/month

### When to Use v1 (AWS Bedrock)

✅ **Choose v1 if:**
- Need HIPAA compliance
- Have > 10,000 daily active users
- Require complete data control
- Need advanced guardrails
- Budget > $5000/month

### Migration Path

Start with v0, then migrate to v1:

1. **Data Migration**
   - Export conversations from Vercel KV
   - Import to DynamoDB
   
2. **API Compatibility**
   - Keep same function signatures
   - Update endpoint URLs only

3. **Feature Parity**
   - Ensure all v0 tools work in v1
   - Add advanced features after migration

---

## Part 5: Security & Compliance Checklist

### For Both Versions

- [ ] API keys in environment variables
- [ ] Rate limiting implemented
- [ ] Audit logging for all AI actions
- [ ] Human approval for critical actions
- [ ] Regular security reviews
- [ ] Incident response plan
- [ ] Data retention policies
- [ ] User consent for AI interactions

### Additional for v1

- [ ] AWS BAA signed
- [ ] VPC security groups configured
- [ ] KMS encryption enabled
- [ ] CloudTrail logging active
- [ ] Guardrails tested
- [ ] Penetration testing completed
- [ ] SOC 2 evidence collected
- [ ] Disaster recovery plan

---

## Part 6: Cost Estimates

### v0 Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI GPT-4 | 1M tokens/day | ~$300 |
| Vercel Pro | Hosting + KV | $20 |
| Supabase | Existing | $0 |
| **Total** | | **~$320** |

### v1 Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Bedrock Claude | 10M tokens/day | ~$1500 |
| App Runner | 2 instances | ~$100 |
| CloudTrail | Logging | ~$50 |
| VPC + NAT | Network | ~$200 |
| S3 + Backup | Storage | ~$100 |
| **Total** | | **~$1950** |

---

## Conclusion

For Situ8's AI Assistant:

1. **Start with v0** for proof of concept (2-3 weeks)
2. **Validate with users** and gather feedback
3. **Plan v1 migration** based on growth and compliance needs
4. **Use this guide** as the implementation blueprint

The v0 approach gets you to market fast with basic compliance, while v1 provides the enterprise-grade foundation for scale. Both approaches integrate seamlessly with your existing Situ8 architecture and can create incidents/activities that display in your current UI components.