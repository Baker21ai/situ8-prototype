import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
    react({
      // Optimize React DevTools in production
      babel: {
        compact: true,
        minified: true
      }
    }),
    // Bundle analyzer for optimization insights (only in dev)
    ...(mode === 'development' ? [(() => {
      try {
        const { visualizer } = require('rollup-plugin-visualizer');
        return visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        });
      } catch (e) {
        console.log('Visualizer plugin not available');
        return null;
      }
    })()] : []),
    // Enable compression plugins only if available (for production builds)
    ...(mode === 'production' ? (() => {
      try {
        const viteCompression = require('vite-plugin-compression');
        return [
          // Enable gzip compression
          viteCompression({
            algorithm: 'gzip',
            ext: '.gz'
          }),
          // Enable brotli compression for better compression ratio
          viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br'
          })
        ];
      } catch (e) {
        console.log('Compression plugin not available, skipping compression');
        return [];
      }
    })() : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-window',
      'lucide-react',
      'zustand',
      'framer-motion'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020', // Updated for better performance
    cssCodeSplit: true,
    reportCompressedSize: false, // Disable for faster builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Enhanced manual chunking strategy
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // React Window (virtual scrolling)
            if (id.includes('react-window') || id.includes('react-virtualized')) {
              return 'virtualization-vendor';
            }
            // UI Library (Radix)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Utility libraries
            if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // State management
            if (id.includes('zustand') || id.includes('immer')) {
              return 'state-vendor';
            }
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Other vendors
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('src/presentation/organisms')) {
            return 'components-complex';
          }
          if (id.includes('src/presentation/molecules')) {
            return 'components-medium';
          }
          if (id.includes('src/presentation/atoms')) {
            return 'components-simple';
          }
          if (id.includes('components/')) {
            return 'components';
          }
          if (id.includes('services/')) {
            return 'services';
          }
          if (id.includes('stores/')) {
            return 'stores';
          }
          if (id.includes('lib/')) {
            return 'lib';
          }
        },
        // Optimize asset names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
      // External dependencies for CDN loading (optional)
      external: [],
    },
  },
  // Development server optimizations
  server: {
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  // CSS optimizations
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      // Add any CSS preprocessor options here
    },
  },
  // Enable experimental features for better performance
  esbuild: {
    target: 'es2020',
    keepNames: false,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
  },
}))