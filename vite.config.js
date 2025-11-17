import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/data-viewer/',  // 👈 add this line (your repo name)
})
