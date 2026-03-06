import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hr-training-advisor/',   // <-- must match your GitHub repo name
  build: {
    outDir: 'dist'
  }
})
