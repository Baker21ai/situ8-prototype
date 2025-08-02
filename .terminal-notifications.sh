#!/bin/bash

# Terminal Notification Setup Script
# This script sets up various notification methods for your terminal

echo "Setting up terminal notifications..."

# 1. Enable terminal bell
echo "Enabling terminal bell..."
echo "set bell-style audible" >> ~/.inputrc

# 2. Add notification function to your shell
SHELL_CONFIG=""
if [ -f ~/.zshrc ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f ~/.bashrc ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f ~/.bash_profile ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
else
    echo "Creating .zshrc for notifications..."
    SHELL_CONFIG="$HOME/.zshrc"
    touch "$SHELL_CONFIG"
fi

# Add notification functions if they don't exist
if ! grep -q "notify_done" "$SHELL_CONFIG"; then
    echo "" >> "$SHELL_CONFIG"
    echo "# Terminal Notifications" >> "$SHELL_CONFIG"
    echo "# Function to notify when command is done" >> "$SHELL_CONFIG"
    echo 'notify_done() {' >> "$SHELL_CONFIG"
    echo '    if command -v osascript >/dev/null 2>&1; then' >> "$SHELL_CONFIG"
    echo '        # macOS notification' >> "$SHELL_CONFIG"
    echo '        osascript -e "display notification \"Command completed\" with title \"Terminal\""' >> "$SHELL_CONFIG"
    echo '        # Also play a sound' >> "$SHELL_CONFIG"
    echo '        afplay /System/Library/Sounds/Glass.aiff' >> "$SHELL_CONFIG"
    echo '    fi' >> "$SHELL_CONFIG"
    echo '}' >> "$SHELL_CONFIG"
    echo "" >> "$SHELL_CONFIG"
    echo "# Alias to run command and notify when done" >> "$SHELL_CONFIG"
    echo 'alias rn="run_and_notify"' >> "$SHELL_CONFIG"
    echo 'run_and_notify() {' >> "$SHELL_CONFIG"
    echo '    "$@"' >> "$SHELL_CONFIG"
    echo '    notify_done' >> "$SHELL_CONFIG"
    echo '}' >> "$SHELL_CONFIG"
    echo "" >> "$SHELL_CONFIG"
    echo "# Auto-notify for long running commands" >> "$SHELL_CONFIG"
    echo 'preexec() {' >> "$SHELL_CONFIG"
    echo '    timer=$(($(date +%s%0N)/1000000))' >> "$SHELL_CONFIG"
    echo '}' >> "$SHELL_CONFIG"
    echo "" >> "$SHELL_CONFIG"
    echo 'precmd() {' >> "$SHELL_CONFIG"
    echo '    if [ $timer ]; then' >> "$SHELL_CONFIG"
    echo '        now=$(($(date +%s%0N)/1000000))' >> "$SHELL_CONFIG"
    echo '        elapsed=$(($now-$timer))' >> "$SHELL_CONFIG"
    echo '        # Notify if command took longer than 10 seconds' >> "$SHELL_CONFIG"
    echo '        if [ $elapsed -gt 10000 ]; then' >> "$SHELL_CONFIG"
    echo '            notify_done' >> "$SHELL_CONFIG"
    echo '        fi' >> "$SHELL_CONFIG"
    echo '        unset timer' >> "$SHELL_CONFIG"
    echo '    fi' >> "$SHELL_CONFIG"
    echo '}' >> "$SHELL_CONFIG"
fi

echo "Terminal notifications setup complete!"
echo "Restart your terminal or run: source $SHELL_CONFIG"
echo ""
echo "Usage examples:"
echo "  rn npm install    # Run command and notify when done"
echo "  Long commands (>10s) will auto-notify"