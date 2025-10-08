import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,                     // (default port)
    open: true,                     // auto open in browser
    host: '127.0.0.1',              // match your redirect_uri
    strictPort: true,               // don’t auto-change ports
    historyApiFallback: true        // ✅ let React Router handle /callback etc.
  }
})
