// Dev-only (#/capture): renders every object's gallery posters, assembled and
// exploded, at two sizes, and posts them to the dev server, which writes them
// to public/posters/. Run it after adding or re-framing a model.
import { things } from '../content';
import type { Page } from '../dom';
import { Viewer } from '../viewer/Viewer';

const SIZE = 1280;

async function save(name: string, blob: Blob): Promise<void> {
  const res = await fetch(`/__capture?file=${name}`, { method: 'POST', body: blob });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
}

async function downscale(blob: Blob, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { resizeWidth: size, resizeHeight: size, resizeQuality: 'high' });
  const canvas = new OffscreenCanvas(size, size);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
}

export function capture(main: HTMLElement): Page {
  const only = new URLSearchParams(location.hash.split('?')[1] ?? '').get('only');
  main.innerHTML = `
    <div class="capture">
      <h1 tabindex="-1">Poster capture</h1>
      <ol class="capture__log" aria-live="polite"></ol>
      <div class="capture__stage" style="width:${SIZE}px;height:${SIZE}px"></div>
    </div>`;
  const log = main.querySelector('.capture__log')!;
  const stage = main.querySelector<HTMLElement>('.capture__stage')!;
  const note = (text: string) => log.insertAdjacentHTML('beforeend', `<li>${text}</li>`);

  void (async () => {
    for (const thing of things.filter((t) => !only || t.slug === only)) {
      // Clocks in posters show 10:08, the hands-apart time watchmakers photograph by.
      const viewer = new Viewer(stage, { capture: true, reducedMotion: true, pixelRatio: 1, time: () => new Date(2000, 0, 1, 10, 8, 36) });
      try {
        await viewer.load(thing);
        for (const exploded of [false, true]) {
          viewer.setExplode(exploded ? 1 : 0);
          viewer.applyPose(viewer.framedHomePose());
          const full = await viewer.snapshot('image/webp', 0.9);
          const name = `${thing.slug}${exploded ? '-exploded' : ''}`;
          await save(`${name}-1280.webp`, full);
          await save(`${name}-800.webp`, await downscale(full, 800));
          note(`✓ ${name} (${Math.round(full.size / 1024)} KB)`);
        }
      } catch (error) {
        note(`✗ ${thing.slug}: ${(error as Error).message}`);
      } finally {
        viewer.dispose();
      }
    }
    note('done');
    document.body.dataset.captureDone = 'true';
  })();

  return { title: 'Poster capture' };
}
