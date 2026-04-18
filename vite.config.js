import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
    host: true,       // or '0.0.0.0' to listen on all interfaces [web:0]
    port: 5173,
    strictPort: true, // optional: fail if 5173 is taken instead of auto‑incrementing [web:0]
    open: false,
  },
})
