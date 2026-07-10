import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ['@hugeicons/core-free-icons'],
    exclude: [
      '@tanstack/react-start',
      '@tanstack/react-start-client',
      '@tanstack/react-start-server',
      '@tanstack/start-server-core',
      '@tanstack/start-client-core',
      '@tanstack/start-storage-context',
      '@tanstack/start-plugin-core',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8101',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})

export default config
