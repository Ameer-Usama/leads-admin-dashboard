	import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_ORIGIN = 'http://31.97.73.96:3001'
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': API_ORIGIN,
      },
      allowedHosts: ['admin.leadsengine.ai'],
    },
    preview: {
      port: 5173,
    },
  }
})
