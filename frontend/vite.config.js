import { defineConfig } from 'vite'

export default defineConfig({
  clearScreen: false,
  server: {
    port: 34115,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: true,
  },
})
