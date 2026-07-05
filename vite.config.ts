import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// UniVoucher runs entirely client-side: it talks to a Sphere wallet
// (extension, popup, or parent iframe) over the Connect protocol,
// never handling private keys itself.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
  },
});
