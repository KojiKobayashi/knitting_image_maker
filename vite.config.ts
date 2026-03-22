import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/knitting_image_maker/',
  plugins: [react()],
})
