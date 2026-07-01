import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    // 启用原生 tsconfig paths 支持
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ['@hugeicons/core-free-icons'],
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
