import { defineConfig, type Plugin } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Dev-only endpoint for the poster capture page (#/capture): it renders each
 * model and posts the images here, and they're written to public/posters/.
 */
function posterCapture(): Plugin {
  return {
    name: 'poster-capture',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__capture', async (req, res) => {
        const name = new URL(req.url ?? '/', 'http://localhost').searchParams.get('file') ?? '';
        if (req.method !== 'POST' || !/^[a-z0-9-]+\.webp$/.test(name)) {
          res.statusCode = 400;
          res.end('Expected POST /__capture?file=<name>.webp');
          return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const dest = path.join(server.config.root, 'public', 'posters', name);
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, Buffer.concat(chunks));
        res.end('ok');
      });
    },
  };
}

export default defineConfig({
  // Relative asset URLs, so the build works from any path (GitHub Pages project
  // sites, Vercel, a plain static server). Routing is hash-based for the same reason.
  base: './',
  plugins: [posterCapture()],
  build: {
    target: 'es2022',
    // The object-page chunk is three.js (~200 kB gzipped). It's lazy-loaded and prefetched while the gallery is idle.
    chunkSizeWarningLimit: 900,
  },
});
