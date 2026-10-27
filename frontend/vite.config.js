import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The API only accepts http://localhost:5173 (CORS), so never switch to another port
  server: { port: 5173, strictPort: true },
})
