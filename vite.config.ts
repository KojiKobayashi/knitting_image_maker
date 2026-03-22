import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/csv2image_js/',
  plugins: [react()],
})
