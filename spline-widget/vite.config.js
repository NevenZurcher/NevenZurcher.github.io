import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../assets/spline-widget'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src', 'main.jsx'),
      output: {
        entryFileNames: 'spline-widget.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
