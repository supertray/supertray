import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/'],
  target: 'node16',
  format: ['cjs'],
  minifyIdentifiers: false,
  bundle: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  outDir: 'lib',
});
