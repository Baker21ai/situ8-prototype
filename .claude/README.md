# Claude Hooks Setup for Situ8 Security Platform

This directory contains Claude Hooks configuration and automation scripts that enhance your development workflow with AI-powered assistance.

## 🎯 What Are Claude Hooks?

Claude Hooks are automated triggers that execute at specific points during Claude's coding process. They act like event listeners for AI behavior, allowing you to:

- **Automate repetitive tasks** (formatting, testing, validation)
- **Enforce code quality** (linting, type checking, security scans)
- **Maintain consistency** (naming conventions, documentation)
- **Enhance safety** (prevent dangerous operations, validate changes)

## 📁 File Structure

```
.claude/
├── settings.toml          # Main hooks configuration
├── settings.local.json    # Local permissions and settings
├── commands/              # AI agent command definitions
└── scripts/               # Automation scripts
    ├── validate-component.js      # Component structure validation
    ├── generate-test-file.js      # Auto-generate test templates
    ├── suggest-commit-message.js  # Smart commit message suggestions
    ├── update-component-index.js  # Maintain component exports
    └── update-docs.js            # Documentation maintenance
```

## 🚀 Active Hooks

### TypeScript & React Hooks
- **Auto-formatting**: Prettier + ESLint on file save
- **Type checking**: Real-time TypeScript validation
- **Component validation**: Structure and best practices

### Testing Hooks
- **Auto-test generation**: Creates test templates for new components
- **Test execution**: Runs relevant tests after changes

### Security Hooks
- **Dangerous command prevention**: Blocks `rm -rf` and similar
- **Dependency scanning**: NPM audit on package changes

### Development Workflow
- **Dev server restart**: Auto-restart on config changes
- **Commit suggestions**: Smart commit message generation
- **Documentation updates**: Maintain docs and TOCs

## 🛠️ How It Works

### Hook Types

1. **PreToolUse**: Executes before Claude uses a tool
   ```toml
   [[hooks]]
   event = "PreToolUse"
   [hooks.matcher]
   tool_name = "bash"
   query = "rm -rf"
   command = "echo 'BLOCKED: Dangerous command' && exit 1"
   ```

2. **PostToolUse**: Executes after Claude completes a task
   ```toml
   [[hooks]]
   event = "PostToolUse"
   [hooks.matcher]
   tool_name = "edit_file"
   file_paths = ["*.tsx"]
   command = "npx prettier --write $CLAUDE_FILE_PATHS"
   ```

3. **Notification**: Triggers when Claude needs to inform you
4. **Stop**: Executes when Claude finishes its response

### Environment Variables

- `$CLAUDE_FILE_PATHS`: Paths of files being modified
- `$CLAUDE_TOOL_NAME`: Name of the tool being used
- `$CLAUDE_QUERY`: Query or command being executed

## 🎮 Usage Examples

### When you create a new component:
1. **Component validation** runs automatically
2. **Test file generation** creates a test template
3. **Index file update** adds the export
4. **Commit message suggestion** provides a conventional commit

### When you modify TypeScript files:
1. **Prettier formatting** applies automatically
2. **ESLint fixes** resolve style issues
3. **Type checking** validates TypeScript
4. **Tests run** for the modified files

### When you edit configuration:
1. **Build validation** ensures everything still works
2. **Dev server restart** applies changes immediately
3. **Security scan** checks for vulnerabilities

## 🔧 Customization

### Adding New Hooks

Edit `settings.toml` to add new automation:

```toml
[[hooks]]
event = "PostToolUse"
[hooks.matcher]
tool_name = "edit_file"
file_paths = ["your-pattern/**/*.ts"]
command = "your-custom-command $CLAUDE_FILE_PATHS"
run_in_background = true
```

### Creating Custom Scripts

Add new scripts to the `scripts/` directory:

```javascript
#!/usr/bin/env node
// Your custom automation script
const filePaths = process.argv.slice(2);
// Process the files...
```

### Disabling Hooks

Comment out or remove hooks in `settings.toml`:

```toml
# [[hooks]]
# event = "PostToolUse"
# [hooks.matcher]
# tool_name = "edit_file"
# command = "disabled-command"
```

## 🔒 Security & Permissions

The `settings.local.json` file controls what commands Claude can execute:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm install:*)",
      "Bash(npm run dev:*)",
      "mcp__ide__getDiagnostics"
    ],
    "deny": []
  }
}
```

## 📊 Monitoring

Watch the terminal output to see hooks in action:

```
🔍 Validating component: components/NewComponent.tsx
✅ Component validation passed
🎉 New component created: components/NewComponent.tsx
💡 Suggested commit message: feat(components): add NewComponent implementation
```

## 🚨 Troubleshooting

### Hook Not Running
- Check file path patterns in `settings.toml`
- Verify script permissions (`chmod +x`)
- Check Claude's permissions in `settings.local.json`

### Script Errors
- Review script logs in terminal
- Test scripts manually: `node .claude/scripts/script-name.js file-path`
- Check Node.js version compatibility

### Performance Issues
- Set `run_in_background = true` for non-critical hooks
- Reduce hook frequency for large projects
- Use specific file patterns instead of wildcards

## 🎯 Best Practices

1. **Start small**: Enable a few hooks first, then expand
2. **Test scripts**: Manually test automation scripts before adding hooks
3. **Monitor performance**: Watch for hooks that slow down development
4. **Use background execution**: For non-critical validations
5. **Provide feedback**: Use echo commands for important notifications

## 🔄 Updates

To update the hooks configuration:

1. Edit `settings.toml` for new automation
2. Add scripts to `scripts/` directory
3. Update permissions in `settings.local.json` if needed
4. Test changes with a small file modification

---

**Happy coding with Claude Hooks! 🚀**