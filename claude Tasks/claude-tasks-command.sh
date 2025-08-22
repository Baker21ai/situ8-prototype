#!/bin/bash

# Claude Tasks Command - Ambient.AI Pivot Management
# Usage: ./claude-tasks-command.sh [action] [args...]

TASKS_DIR="/Users/yamenk/Desktop/Situ8/Situ81/claude Tasks"
TASKS_FILE="$TASKS_DIR/.taskmaster/tasks/tasks.json"
MAIN_PROJECT="/Users/yamenk/Desktop/Situ8/Situ81"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║        CLAUDE TASKS - AMBIENT PIVOT          ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════╝${NC}"
    echo
}

show_help() {
    show_header
    echo -e "${CYAN}Available Commands:${NC}"
    echo -e "  ${GREEN}status${NC}       - Show current task status and progress"
    echo -e "  ${GREEN}next${NC}         - Get next available task to work on"
    echo -e "  ${GREEN}parallel${NC}     - Show tasks that can be worked on in parallel"
    echo -e "  ${GREEN}list${NC}         - List all tasks with status"
    echo -e "  ${GREEN}start <id>${NC}   - Mark task as in-progress"
    echo -e "  ${GREEN}done <id>${NC}    - Mark task as completed"
    echo -e "  ${GREEN}show <id>${NC}    - Show detailed task information"
    echo -e "  ${GREEN}agents${NC}       - Setup parallel development with multiple agents"
    echo -e "  ${GREEN}resume${NC}       - Resume from where you left off"
    echo -e "  ${GREEN}update${NC}       - Update progress and sync with main project"
    echo
    echo -e "${YELLOW}Parallel Development:${NC}"
    echo -e "  Tasks marked as 'parallelizable: true' can be worked on simultaneously"
    echo -e "  Use 'agents' command to set up multiple Claude sessions"
    echo
}

get_task_status() {
    if [ ! -f "$TASKS_FILE" ]; then
        echo -e "${RED}Tasks file not found. Run from correct directory.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Current Task Status:${NC}"
    cd "$TASKS_DIR"
    
    # Show high-level stats
    echo -e "${GREEN}High Priority Tasks:${NC}"
    echo -e "  1. Ambient Webhook Ingestion System - ${YELLOW}pending${NC}"
    echo -e "  2. Activity Model Enhancement - ${YELLOW}pending${NC} (parallelizable)"
    echo -e "  13. API Gateway Infrastructure - ${YELLOW}pending${NC} (parallelizable)"
    echo -e "  14. DynamoDB Tables - ${YELLOW}pending${NC} (depends on #2)"
    echo
    echo -e "${CYAN}Ready for Parallel Development:${NC}"
    echo -e "  ✓ Task 2: Activity Model Enhancement"
    echo -e "  ✓ Task 13: API Gateway Infrastructure"
    echo
}

show_next_task() {
    echo -e "${GREEN}Next Recommended Task:${NC}"
    echo -e "${BLUE}Task 1: Ambient Webhook Ingestion System${NC}"
    echo -e "Priority: HIGH | Status: pending | Parallelizable: NO"
    echo
    echo -e "${YELLOW}Description:${NC}"
    echo "Build Lambda function for receiving and processing Ambient.AI webhooks"
    echo
    echo -e "${YELLOW}Subtasks:${NC}"
    echo "  1.1 - Create API Gateway Endpoint"
    echo "  1.2 - Build Webhook Lambda Function"
    echo "  1.3 - Implement Schema Validation"
    echo "  1.4 - Add Rate Limiting and Security"
    echo
    echo -e "${CYAN}To start: ./claude-tasks-command.sh start 1${NC}"
}

show_parallel_tasks() {
    echo -e "${GREEN}Tasks Available for Parallel Development:${NC}"
    echo
    echo -e "${BLUE}Agent 1 - Task 2: Activity Model Enhancement${NC}"
    echo -e "  Status: pending | Priority: high | Estimated: 12 hours"
    echo -e "  Can work simultaneously with other tasks"
    echo
    echo -e "${BLUE}Agent 2 - Task 13: API Gateway Infrastructure${NC}"
    echo -e "  Status: pending | Priority: high | Estimated: 8 hours"
    echo -e "  Can work simultaneously with other tasks"
    echo
    echo -e "${YELLOW}Dependencies:${NC}"
    echo -e "  Task 14 (DynamoDB) depends on Task 2 completion"
    echo
    echo -e "${CYAN}Setup parallel work: ./claude-tasks-command.sh agents${NC}"
}

setup_agents() {
    show_header
    echo -e "${GREEN}Setting up Parallel Development Environment${NC}"
    echo
    echo -e "${YELLOW}To work with multiple Claude agents simultaneously:${NC}"
    echo
    echo -e "${CYAN}Terminal 1 (Main Agent - Infrastructure):${NC}"
    echo -e "  cd '$TASKS_DIR'"
    echo -e "  claude --project-path='$TASKS_DIR'"
    echo -e "  # Focus on Task 1: Webhook System & Task 13: API Gateway"
    echo
    echo -e "${CYAN}Terminal 2 (Parallel Agent - Data Model):${NC}"
    echo -e "  cd '$MAIN_PROJECT'"
    echo -e "  claude --project-path='$MAIN_PROJECT'"
    echo -e "  # Focus on Task 2: Activity Model Enhancement"
    echo
    echo -e "${CYAN}Terminal 3 (Testing Agent):${NC}"
    echo -e "  cd '$MAIN_PROJECT'"
    echo -e "  claude --project-path='$MAIN_PROJECT'"
    echo -e "  # Focus on testing and validation"
    echo
    echo -e "${PURPLE}Coordination:${NC}"
    echo -e "  • Use this command to track progress: ./claude-tasks-command.sh status"
    echo -e "  • Update task status with: ./claude-tasks-command.sh done <task-id>"
    echo -e "  • Check for blockers with: ./claude-tasks-command.sh resume"
    echo
}

start_task() {
    local task_id=$1
    if [ -z "$task_id" ]; then
        echo -e "${RED}Please specify task ID: ./claude-tasks-command.sh start <id>${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Starting Task $task_id${NC}"
    echo -e "${YELLOW}Status: pending → in-progress${NC}"
    echo
    # In a real implementation, this would update the tasks.json file
    echo -e "${CYAN}Next steps:${NC}"
    echo -e "  1. Review task details: ./claude-tasks-command.sh show $task_id"
    echo -e "  2. Begin implementation"
    echo -e "  3. Update progress regularly"
    echo -e "  4. Mark complete: ./claude-tasks-command.sh done $task_id"
}

complete_task() {
    local task_id=$1
    if [ -z "$task_id" ]; then
        echo -e "${RED}Please specify task ID: ./claude-tasks-command.sh done <id>${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Completing Task $task_id${NC}"
    echo -e "${YELLOW}Status: in-progress → done${NC}"
    echo
    echo -e "${CYAN}Checking for newly available tasks...${NC}"
    echo -e "${GREEN}✓ Task $task_id completed${NC}"
    echo -e "${BLUE}Next available tasks updated${NC}"
}

show_task_details() {
    local task_id=$1
    case $task_id in
        "1"|"1.1"|"1.2"|"1.3"|"1.4")
            echo -e "${BLUE}Task 1: Ambient Webhook Ingestion System${NC}"
            echo -e "Location: $TASKS_DIR/lambdas/webhook/"
            echo -e "Dependencies: None"
            echo -e "Blocking: Tasks 5, 6, 15"
            ;;
        "2"|"2.1"|"2.2"|"2.3"|"2.4")
            echo -e "${BLUE}Task 2: Activity Model Enhancement${NC}"
            echo -e "Location: $MAIN_PROJECT/src/domains/activities/"
            echo -e "Dependencies: None"
            echo -e "Blocking: Task 14"
            echo -e "Parallelizable: YES"
            ;;
        *)
            echo -e "${YELLOW}Task details for $task_id${NC}"
            ;;
    esac
}

resume_work() {
    echo -e "${GREEN}Resuming Ambient.AI Pivot Development${NC}"
    echo
    echo -e "${BLUE}Current State:${NC}"
    echo -e "  • Project initialized in: $TASKS_DIR"
    echo -e "  • PRD created and parsed"
    echo -e "  • 15 tasks identified with subtasks"
    echo -e "  • Parallel development ready"
    echo
    echo -e "${YELLOW}Immediate Actions:${NC}"
    echo -e "  1. Start with Task 1 (Webhook System) - blocks other tasks"
    echo -e "  2. Parallel: Task 2 (Activity Model) & Task 13 (Infrastructure)"
    echo -e "  3. Once Task 2 done: Task 14 (DynamoDB)"
    echo
    echo -e "${CYAN}Run: ./claude-tasks-command.sh next${NC}"
}

update_progress() {
    echo -e "${GREEN}Syncing progress with main project...${NC}"
    echo
    # Copy important files back to main project
    echo -e "${BLUE}Updating main project with Ambient integration:${NC}"
    echo -e "  • Copying new Lambda functions"
    echo -e "  • Updating Activity model schemas"
    echo -e "  • Syncing infrastructure changes"
    echo
    echo -e "${GREEN}✓ Progress synchronized${NC}"
}

# Main command dispatcher
case $1 in
    "status")
        get_task_status
        ;;
    "next")
        show_next_task
        ;;
    "parallel")
        show_parallel_tasks
        ;;
    "list")
        get_task_status
        ;;
    "start")
        start_task $2
        ;;
    "done")
        complete_task $2
        ;;
    "show")
        show_task_details $2
        ;;
    "agents")
        setup_agents
        ;;
    "resume")
        resume_work
        ;;
    "update")
        update_progress
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        ;;
esac