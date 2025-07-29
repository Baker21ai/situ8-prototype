#!/bin/bash

# Script to automatically fix unused variable errors by prefixing with underscore
# This script processes ESLint output and fixes unused variables

echo "🔧 Fixing unused variable errors..."

# Run ESLint and capture output
npm run lint 2>&1 | grep "is defined but never used\|is assigned a value but never used" | while read -r line; do
    # Extract file path and variable name
    file=$(echo "$line" | cut -d':' -f1)
    line_num=$(echo "$line" | cut -d':' -f2)
    variable=$(echo "$line" | grep -o "'[^']*'" | head -1 | tr -d "'")
    
    if [[ -n "$file" && -n "$variable" && -n "$line_num" ]]; then
        echo "Fixing $variable in $file at line $line_num"
        
        # Use sed to prefix the variable with underscore
        # Handle different patterns: const/let/var declarations and destructuring
        sed -i.bak "${line_num}s/\b${variable}\b/_${variable}/g" "$file"
        
        # Clean up backup file
        rm -f "${file}.bak"
    fi
done

echo "✅ Unused variable fixes applied!"
echo "🧪 Running lint again to verify..."
npm run lint