import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['vite.svg'],
      manifest: {
        name: "Boardgame Crew",
        short_name: "BG Crew",
        description: "보드게임 크루 전적 기록 및 랭킹 관리 앱",
        theme_color: "#f5ead8",
        background_color: "#f5ead8",
        display: "standalone",
        icons: [
          {
            src: "/vite.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
})
