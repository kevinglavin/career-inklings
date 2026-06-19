import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // html2canvas is only pulled in by jsPDF's .html() path, which this app never uses
      // (PDFs are built with the text-based jsPDF API). Stub it so it isn't bundled (~200 KB).
      html2canvas: path.resolve(__dirname, 'html2canvas-stub.js'),
    },
  },
});
