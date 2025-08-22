console.log('🔍 Environment Test:');
console.log('import.meta.env:', import.meta.env);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);
console.log('BASE_URL:', import.meta.env.BASE_URL);

// Test VITE_ prefixed vars
console.log('\n🔍 VITE_ Variables:');
Object.keys(import.meta.env).forEach(key => {
  if (key.startsWith('VITE_')) {
    console.log(`${key}:`, import.meta.env[key]);
  }
});

// Test if process.env works
console.log('\n🔍 Process.env:');
console.log('process.env:', typeof process !== 'undefined' ? process.env : 'undefined');

export {};