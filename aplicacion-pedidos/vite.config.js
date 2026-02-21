import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'], // 👈 Asume que tienes tu logo.png en la carpeta public
      manifest: {
        name: 'Pastelería Ximena',
        short_name: 'Pastelería',
        description: 'Administración de pedidos y finanzas',
        theme_color: '#fdf2f8',
        background_color: '#fdf2f8',
        display: 'standalone', // 👈 Esto hace que se abra sin la barra de Safari/Chrome
        icons: [
          {
            src: 'logo.png', // Debe coincidir con la imagen que guardaste antes en "public"
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})