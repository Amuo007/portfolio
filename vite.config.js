import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/portfolio/',
  build: {
    rollupOptions: {
      // Multi-page build: /instagram/ and /doc/ are unlisted pages that only
      // people with the direct link ever see.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        instagram: fileURLToPath(
          new URL('./instagram/index.html', import.meta.url)
        ),
        doc: fileURLToPath(new URL('./doc/index.html', import.meta.url)),
      },
    },
  },
})
