import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/sdk/index.ts'],
  outDir: 'sdk/dist',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@radix-ui/*',
    'lucide-react',
    'sonner',
    'class-variance-authority',
    'clsx',
    'tailwind-merge'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
