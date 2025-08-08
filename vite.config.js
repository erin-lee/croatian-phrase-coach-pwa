import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deploying to GitHub Pages under a repository path requires setting `base`.
// For this repo (erin-lee/croatian-phrase-coach-pwa), the public URL will be
// https://erin-lee.github.io/croatian-phrase-coach-pwa/
// so we set base accordingly. Also ensure the PWA manifest scope and start_url
// align with this base, and use relative icon paths so they resolve correctly
// under the subpath.
export default defineConfig({
  base: '/croatian-phrase-coach-pwa/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Croatian Phrase Coach',
        short_name: 'HR Coach',
        description: 'Learn Croatian phrases anywhere, offline.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/croatian-phrase-coach-pwa/',
        start_url: '/croatian-phrase-coach-pwa/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
