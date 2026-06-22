import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Self-contained CareerVerse app. Base is relative so it can be hosted from a
// subpath (e.g. /careerverse/) on the same domain as the Inklings app.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180, host: true },
  build: { target: 'es2020', sourcemap: false },
});
