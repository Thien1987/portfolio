import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/main.tsx'),
      name: 'MarginDashboard',
      formats: ['iife'],
      fileName: () => 'margin.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (asset) => asset.name?.endsWith('.css') ? 'margin.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
