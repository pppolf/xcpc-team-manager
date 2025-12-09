import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173, // 前端端口 (默认就是这个)
    proxy: {
      // 1. 接口代理
      // 前端请求: /api/users -> 代理为: http://localhost:3000/users
      '/api': {
        target: 'http://localhost:3000', // 后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },

      // 2. 静态资源(图片)代理
      // 前端请求: /uploads/123.png -> 代理为: http://localhost:3000/uploads/123.png
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
