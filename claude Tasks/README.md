# Claude Tasks - Ambient.AI Pivot

This directory contains the task management system for pivoting Situ8 from a standalone security platform to an operations layer on top of Ambient.AI.

## Quick Start

```bash
# Show current status
./claude-tasks-command.sh status

# Get next task to work on
./claude-tasks-command.sh next

# Setup parallel development
./claude-tasks-command.sh agents

# Resume from where you left off
./claude-tasks-command.sh resume
```

## Project Structure

```
claude Tasks/
├── .taskmaster/           # Task Master project files
│   ├── tasks/
│   │   └── tasks.json     # Main task database
│   ├── docs/
│   │   └── prd.txt        # Ambient.AI integration PRD
│   └── config.json        # AI model configuration
├── ambient-pivot-prd.txt  # Original requirements document
├── claude-tasks-command.sh # Command-line interface
└── README.md              # This file
```

## Task Breakdown

### Phase 1: Foundation (Parallel Development Ready)

**Task 1: Ambient Webhook Ingestion System** (Critical Path)
- 1.1 Create API Gateway Endpoint  
- 1.2 Build Webhook Lambda Function
- 1.3 Implement Schema Validation
- 1.4 Add Rate Limiting and Security

**Task 2: Activity Model Enhancement** (Parallelizable)
- 2.1 Extend Activity Entity Schema
- 2.2 Update Activity Service  
- 2.3 Update DynamoDB Schema
- 2.4 Update TypeScript Types

**Task 13: API Gateway Infrastructure** (Parallelizable)
- Set up AWS infrastructure
- Configure IAM roles and permissions
- Deploy Lambda functions

**Task 14: DynamoDB Tables** (Depends on Task 2)
- Create new tables for SOP rules
- Migrate existing Activity schema
- Set up indexes and capacity

### Parallel Development Strategy

1. **Agent 1 (Infrastructure Focus)**: Work on Tasks 1 & 13
   - Webhook system and API Gateway setup
   - Critical path items that block other work

2. **Agent 2 (Data Model Focus)**: Work on Task 2  
   - Activity model enhancement
   - Can work simultaneously with infrastructure

3. **Agent 3 (Testing & Integration)**: Support both agents
   - Write tests as components are developed
   - Integration testing and validation

## Commands Reference

### Basic Commands
- `./claude-tasks-command.sh status` - Current progress overview
- `./claude-tasks-command.sh next` - Get next recommended task
- `./claude-tasks-command.sh list` - List all tasks
- `./claude-tasks-command.sh show <id>` - Detailed task info

### Workflow Commands  
- `./claude-tasks-command.sh start <id>` - Mark task as in-progress
- `./claude-tasks-command.sh done <id>` - Mark task as completed
- `./claude-tasks-command.sh resume` - Resume from where you left off
- `./claude-tasks-command.sh update` - Sync progress with main project

### Parallel Development
- `./claude-tasks-command.sh parallel` - Show parallelizable tasks
- `./claude-tasks-command.sh agents` - Setup multi-agent workflow

## Multi-Agent Workflow

### Terminal 1: Infrastructure Agent
```bash
cd "/Users/yamenk/Desktop/Situ8/Situ81/claude Tasks"
claude --project-path="/Users/yamenk/Desktop/Situ8/Situ81/claude Tasks"
# Focus: Task 1 (Webhook System) & Task 13 (API Gateway)
```

### Terminal 2: Data Model Agent  
```bash
cd "/Users/yamenk/Desktop/Situ8/Situ81"
claude --project-path="/Users/yamenk/Desktop/Situ8/Situ81"
# Focus: Task 2 (Activity Model Enhancement)
```

### Terminal 3: Testing Agent
```bash
cd "/Users/yamenk/Desktop/Situ8/Situ81"  
claude --project-path="/Users/yamenk/Desktop/Situ8/Situ81"
# Focus: Testing, integration, and validation
```

## Progress Tracking

Tasks are tracked in `.taskmaster/tasks/tasks.json` with the following statuses:
- `pending` - Ready to work on
- `in-progress` - Currently being worked on  
- `done` - Completed and verified
- `blocked` - Waiting on dependencies

Use the command interface to update status and coordinate between agents.

## Integration with Main Project

The main Situ8 project is located at `/Users/yamenk/Desktop/Situ8/Situ81/`. Changes made in this task directory should be synchronized back to the main project using:

```bash
./claude-tasks-command.sh update
```

This ensures all agents stay in sync and the main codebase receives the Ambient.AI integration changes.

## Getting Started

1. Run `./claude-tasks-command.sh status` to see current state
2. Run `./claude-tasks-command.sh agents` to set up parallel development
3. Start with Task 1 in Terminal 1 and Task 2 in Terminal 2
4. Use `./claude-tasks-command.sh resume` anytime to get oriented

The system is designed to support multiple Claude agents working simultaneously while maintaining coordination and avoiding conflicts.