import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

// Auto-derives PWA icon assets (favicon, apple-touch-icon, 64/192/512 + maskable)
// from the project's favicon.svg. Runs automatically as part of `vite build`.
export default defineConfig({
  preset,
  images: ['public/favicon.svg'],
})
