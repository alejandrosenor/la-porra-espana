import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'La Porra de España',
        short_name: 'La Porra',
        description: 'Apuestas entre amigos para los partidos de España',
        theme_color: '#850014',
        background_color: '#13070a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/login',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})