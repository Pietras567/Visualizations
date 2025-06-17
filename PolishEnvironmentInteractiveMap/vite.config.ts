import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/pjp-api': {
                target: 'https://api.gios.gov.pl',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/pjp-api/, '/pjp-api'),
            },
        },
    },
})
