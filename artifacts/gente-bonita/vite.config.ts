import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT || '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || '/';

function localUploadPlugin() {
  return {
    name: 'local-upload-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/upload', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const rawFilename = req.headers['x-filename'];
        const filename = rawFilename 
          ? decodeURIComponent(rawFilename as string) 
          : `upload-${Date.now()}`;
        
        const cleanName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const uploadsDir = path.resolve(import.meta.dirname, 'public/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const destPath = path.join(uploadsDir, cleanName);
        const writeStream = fs.createWriteStream(destPath);

        req.pipe(writeStream);

        writeStream.on('finish', () => {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ 
            success: true, 
            url: `/uploads/${cleanName}`,
            filename: cleanName 
          }));
        });

        writeStream.on('error', (err: any) => {
          console.error('Upload write error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to write file' }));
        });
      });
    }
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    localUploadPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
