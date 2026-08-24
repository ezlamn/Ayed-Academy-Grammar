import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// السيرفر شغال على 3100 (3000 محجوز بمشروع Docker تاني على الجهاز)
const API_TARGET = 'http://localhost:3100';

export default defineConfig({
  plugins: [react()],
  // اللوحة بتتخدم من /admin على نفس السيرفر بعد البناء
  base: '/admin/',
  build: {
    outDir: '../public/admin',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // أثناء التطوير، الطلبات بتتمرّر للسيرفر عشان الكوكي تشتغل
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
});
