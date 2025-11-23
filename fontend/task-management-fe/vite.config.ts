import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({mode})=>{
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react(),tailwindcss()],
        resolve:{
            alias:{
                '@': path.resolve(__dirname, './src'),
                '@components': path.resolve(__dirname, './src/components'),
                '@features': path.resolve(__dirname, './src/features'),
                '@config': path.resolve(__dirname,'./src/config'),
                '@store': path.resolve(__dirname,'./src/store'),
                '@routes': path.resolve(__dirname,'./src/routes'),
                '@hooks': path.resolve(__dirname,'./src/hooks'),
            }
        },
        server:{
            proxy:{
                '/api': {
                    target: env.VITE_API_BASE_URL || 'http://localhost:1004',
                    changeOrigin: true,
                }
            }
        },
    }
})
