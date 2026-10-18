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

/**
 * Where the site is mounted when it's baked into another site (`npm run export`), such as
 * "/3d-of-everything": skill.html becomes the mount's index.html and the gallery <mount>/objects/index.html.
 * Unset, every URL is relative and the build works from any path.
 */
const mount = process.env.SITE_MOUNT?.replace(/\/+$/, '');

/** skill.html links to the objects as %OBJECTS%: the gallery beside it, or <mount>/objects when baked in. */
function objectsLinks(href: string): Plugin {
  return {
    name: 'objects-links',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%OBJECTS%', href) },
  };
}

export default defineConfig({
  // Relative asset URLs, so the build works from any path (Vercel, a plain static server, a
  // sub-path). Baked in, absolute ones under the mount, because the host serves its pages without
  // a trailing slash and relative URLs would miss. Routing is hash-based for the same reason.
  base: mount ? `${mount}/` : './',
  plugins: [posterCapture(), objectsLinks(mount ? `${mount}/objects` : './')],
  build: {
    target: 'es2022',
    // The object-page chunk is three.js (~200 kB gzipped). It's lazy-loaded and prefetched while the gallery is idle.
    chunkSizeWarningLimit: 900,
    // skill.html is the skill's page.
    rollupOptions: { input: { main: 'index.html', skill: 'skill.html' } },
  },
});
