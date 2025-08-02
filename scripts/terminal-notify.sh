#!/bin/bash

# Advanced Terminal Notification System
# This script provides multiple notification methods for terminal events

# Configuration
NOTIFICATION_SOUND="/System/Library/Sounds/Glass.aiff"
NOTIFICATION_TITLE="Terminal Alert"
MIN_DURATION=5  # Minimum seconds before notifying

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to send macOS notification
send_notification() {
    local message="$1"
    local title="${2:-$NOTIFICATION_TITLE}"
    
    if command -v osascript >/dev/null 2>&1; then
        osascript -e "display notification \"$message\" with title \"$title\""
        
        # Play sound if available
        if [ -f "$NOTIFICATION_SOUND" ]; then
            afplay "$NOTIFICATION_SOUND" &
        fi
    fi
}

# Function to show visual bell in terminal
visual_bell() {
    echo -e "${RED}🔔 TERMINAL WAITING FOR INPUT 🔔${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    printf '\a'  # ASCII bell character
}

# Function to monitor for input prompts
monitor_for_prompts() {
    local command="$@"
    echo -e "${BLUE}Running: $command${NC}"
    echo -e "${BLUE}Will notify if waiting for input...${NC}"
    
    # Run the command and monitor for common prompt patterns
    timeout 1h bash -c "
        $command 2>&1 | while IFS= read -r line; do
            echo \"\$line\"
            
            # Check for common prompt patterns
            if echo \"\$line\" | grep -qE '(\[Y/n\]|\[y/N\]|Press.*continue|Enter.*:|Password:|Continue\?|Proceed\?)'; then
                $(declare -f send_notification)
                $(declare -f visual_bell)
                send_notification 'Terminal is waiting for your input!' 'Input Required'
                visual_bell
            fi
        done
    "
}

# Function to run command with automatic notification
run_with_notification() {
    local start_time=$(date +%s)
    local command="$@"
    
    echo -e "${GREEN}Starting: $command${NC}"
    
    # Run the command
    "$@"
    local exit_code=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Notify if command took longer than minimum duration
    if [ $duration -gt $MIN_DURATION ]; then
        if [ $exit_code -eq 0 ]; then
            send_notification "Command completed successfully in ${duration}s" "Success"
            echo -e "${GREEN}✅ Command completed successfully${NC}"
        else
            send_notification "Command failed with exit code $exit_code" "Error"
            echo -e "${RED}❌ Command failed${NC}"
        fi
    fi
    
    return $exit_code
}

# Function to setup shell integration
setup_shell_integration() {
    local shell_config=""
    
    # Detect shell configuration file
    if [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        shell_config="$HOME/.bashrc"
        [ ! -f "$shell_config" ] && shell_config="$HOME/.bash_profile"
    fi
    
    if [ -n "$shell_config" ]; then
        echo "Adding notification functions to $shell_config"
        
        # Add alias for notification wrapper
        if ! grep -q "alias notify=" "$shell_config" 2>/dev/null; then
            echo "" >> "$shell_config"
            echo "# Terminal notification aliases" >> "$shell_config"
            echo "alias notify='$(pwd)/scripts/terminal-notify.sh run_with_notification'" >> "$shell_config"
            echo "alias monitor='$(pwd)/scripts/terminal-notify.sh monitor_for_prompts'" >> "$shell_config"
        fi
        
        echo "Shell integration added. Restart terminal or run: source $shell_config"
    fi
}

# Main script logic
case "$1" in
    "send_notification")
        send_notification "$2" "$3"
        ;;
    "visual_bell")
        visual_bell
        ;;
    "monitor_for_prompts")
        shift
        monitor_for_prompts "$@"
        ;;
    "run_with_notification")
        shift
        run_with_notification "$@"
        ;;
    "setup")
        setup_shell_integration
        ;;
    *)
        echo "Terminal Notification System"
        echo "Usage: $0 {send_notification|visual_bell|monitor_for_prompts|run_with_notification|setup}"
        echo ""
        echo "Examples:"
        echo "  $0 setup                                    # Setup shell integration"
        echo "  $0 send_notification 'Hello' 'Title'       # Send notification"
        echo "  $0 run_with_notification npm install       # Run command with notification"
        echo "  $0 monitor_for_prompts ./deploy.sh         # Monitor command for input prompts"
        echo ""
        echo "After setup, you can use:"
        echo "  notify npm install                          # Short alias"
        echo "  monitor ./long-script.sh                   # Monitor for prompts"
        ;;
esac