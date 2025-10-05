import { defineConfig } from 'vite';

export default defineConfig({
  base: import.meta.env.PROD ? '/company_list/' : '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
