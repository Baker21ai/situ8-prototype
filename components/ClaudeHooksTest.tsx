import React from 'react';

interface ClaudeHooksTestProps {
  title?: string;
  description?: string;
}

/**
 * ClaudeHooksTest Component
 * A demo component to test Claude Hooks automation
 */
const ClaudeHooksTest: React.FC<ClaudeHooksTestProps> = ({ 
  title = "Claude Hooks Test", 
  description = "Testing automated workflows" 
}) => {
  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <h2 className="text-2xl font-bold text-blue-900 mb-2">{title}</h2>
      <p className="text-blue-700">{description}</p>
      <div className="mt-4 p-3 bg-white rounded border border-blue-100">
        <p className="text-sm text-gray-600">
          This component was created to demonstrate Claude Hooks automation:
        </p>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
          <li>Component validation ✅</li>
          <li>Auto-formatting ✅</li>
          <li>Test file generation ✅</li>
          <li>Index file updates ✅</li>
          <li>Commit message suggestions ✅</li>
        </ul>
      </div>
    </div>
  );
};

export default ClaudeHooksTest;