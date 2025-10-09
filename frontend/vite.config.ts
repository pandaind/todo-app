import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determine backend URL based on environment
  const getBackendUrl = () => {
    // If explicitly set via environment variable, use it
    if (env.VITE_BACKEND_URL) {
      return env.VITE_BACKEND_URL
    }
    
    // If running in Docker (NODE_ENV is usually set in containers)
    if (env.NODE_ENV === 'production' || env.DOCKER_ENV) {
      return 'http://backend:5000'
    }
    
    // Default for local development
    return 'http://localhost:5000'
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: getBackendUrl(),
          changeOrigin: true
        }
      }
    }
  }
})
