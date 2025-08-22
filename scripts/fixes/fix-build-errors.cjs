const fs = require('fs');
const path = require('path');

const filesToFix = [
  '/Users/yamenk/Desktop/Situ8/Situ81/components/ExpandableRadioCard.tsx',
  '/Users/yamenk/Desktop/Situ8/Situ81/components/InteractiveMap.tsx',
  '/Users/yamenk/Desktop/Situ8/Situ81/components/organisms/ActivityCard.tsx',
  '/Users/yamenk/Desktop/Situ8/Situ81/components/RadioCommunications.tsx',
  '/Users/yamenk/Desktop/Situ8/Situ81/components/RadioModal.tsx',
  '/Users/yamenk/Desktop/Situ8/Situ81/components/GuardManagement.tsx'
];

const fixes = [
  // Fix imports
  {
    file: '/Users/yamenk/Desktop/Situ8/Situ81/components/ExpandableRadioCard.tsx',
    patterns: [
      { search: /_Volume2,/g, replace: 'Volume2,' }
    ]
  },
  {
    file: '/Users/yamenk/Desktop/Situ81/components/InteractiveMap.tsx',
    patterns: [
      { search: /_Maximize2,/g, replace: 'Maximize2,' }
    ]
  },
  {
    file: '/Users/yamenk/Desktop/Situ8/Situ81/components/RadioModal.tsx',
    patterns: [
      { search: /_Volume2,/g, replace: 'Volume2,' }
    ]
  },
  // Fix interface props
  {
    file: '/Users/yamenk/Desktop/Situ8/Situ81/components/organisms/ActivityCard.tsx',
    patterns: [
      { search: /_isHovered = false,/g, replace: 'isHovered = false,' }
    ]
  },
  {
    file: '/Users/yamenk/Desktop/Situ8/Situ81/components/RadioCommunications.tsx',
    patterns: [
      { search: /_showHeader = true,/g, replace: 'showHeader = true,' }
    ]
  },
  // Fix GuardManagement props
  {
    file: '/Users/yamenk/Desktop/Situ8/Situ81/components/GuardManagement.tsx',
    patterns: [
      { search: /_onGuardUpdate,/g, replace: 'onGuardUpdate,' },
      { search: /_onGuardAssign,/g, replace: 'onGuardAssign,' },
      { search: /_onGuardStatusChange,/g, replace: 'onGuardStatusChange,' }
    ]
  }
];

console.log('🔧 Fixing build errors...');

fixes.forEach(({ file, patterns }) => {
  if (!fs.existsSync(file)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  patterns.forEach(({ search, replace }) => {
    const newContent = content.replace(search, replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${path.basename(file)}`);
  }
});

console.log('✅ All build errors fixed!');