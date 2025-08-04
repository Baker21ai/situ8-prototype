import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Support REACT_APP_ environment variables for compatibility
  define: {
    'process.env': Object.keys(process.env)
      .filter(key => key.startsWith('REACT_APP_'))
      .reduce((env, key) => {
        env[key] = JSON.stringify(process.env[key]);
        return env;
      }, {} as Record<string, string>)
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
    // NO MANUAL CHUNKING - let Vite handle it automatically
  }
})