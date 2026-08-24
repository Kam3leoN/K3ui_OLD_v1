import { defineConfig } from 'vite';
import path from 'path';
import purgecss from 'vite-plugin-purgecss';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig(async ({ mode }) => {
  const isProd = mode === 'production' || isProduction;
  const isAnalyze = mode === 'analyze';

  const rollupAnalyzePlugins = [];
  if (isAnalyze) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    rollupAnalyzePlugins.push(
      visualizer({
        filename: path.resolve(__dirname, 'dist/stats.html'),
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
        open: false,
      })
    );
  }

  const terserOptions = {
    compress: {
      drop_console: isProd,
      drop_debugger: isProd,
      passes: 1,
      dead_code: true,
      conditionals: true,
      unused: true,
      evaluate: false,
      loops: false,
      toplevel: false,
      hoist_funs: false,
      hoist_vars: false,
      if_return: true,
      sequences: true,
    },
    mangle: {
      toplevel: false,
      eval: false,
    },
    format: {
      comments: false,
      beautify: false,
      semicolons: true,
    },
  };
  
  return {
  server: {
    open: true,
    proxy: {
      '/k3ui-docs': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            if (!err.message.includes('ECONNREFUSED')) {
            console.log('🔴 Proxy error:', err.message);
            }
          });
        },
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'scss'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '',
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    assetsInlineLimit: 0,
    terserOptions,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.ts'),
      treeshake: {
        moduleSideEffects: false,
      },
      preserveEntrySignatures: 'strict',
      output: {
        dir: path.resolve(__dirname, 'dist/js'),
        entryFileNames: 'k3ui.js',
        chunkFileNames: 'k3ui-[name]-[hash].js',
        assetFileNames: 'assets/ignore/[name][extname]',
        format: 'es',
        exports: 'named',
        inlineDynamicImports: false,
      },
      plugins: rollupAnalyzePlugins,
      external: [],
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    },
  },
  plugins: [
    purgecss({
      content: ['./docs/**/*.php', '../k3ui-docs/**/*.php', './src/**/*.ts', './src/**/*.html'],
      safelist: [
        /^codeblock__token$/,
        /^codeblock__token--/,
        /^ripple$/,
        /^btn(--|$)/,
        /^pace/,
        /^fab/,
      ]
    })
  ]
  };
});
