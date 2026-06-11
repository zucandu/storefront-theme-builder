import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@theme': fileURLToPath(new URL('./src/themes/default', import.meta.url)),
            '@storefront-plugins': fileURLToPath(new URL('./src/plugins', import.meta.url)),
        },
    },
});
