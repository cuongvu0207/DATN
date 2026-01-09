import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,     // Nên để true để biết port bị chiếm
    open: false,
    cors: true,
    // Thêm headers để tránh CORS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 3000
    }
  }
})