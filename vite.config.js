import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Only include src/ for module resolution
  root: '.',
  plugins: [
    {
      name: 'glsl-loader',
      transform(code, id) {
        if (id.endsWith('.glsl')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null,
          };
        }
      },
    },
    {
      // Exclude resources_from_ThreeJS_Journey from being processed
      name: 'exclude-resources',
      resolveId(source, importer) {
        if (importer && importer.includes('resources_from_ThreeJS_Journey')) {
          return { id: source, external: true };
        }
      },
      load(id) {
        if (id.includes('resources_from_ThreeJS_Journey')) {
          return '';
        }
      },
    },
  ],
  server: {
    open: true,
    watch: {
      // Don't watch the reference lessons
      ignored: ['**/resources_from_ThreeJS_Journey/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Only include src/ in the build
      external: (id) => id.includes('resources_from_ThreeJS_Journey'),
    },
  },
  // Exclude reference lessons from dependency optimization
  optimizeDeps: {
    exclude: [],
    entries: ['src/main.js'],
  },
});
