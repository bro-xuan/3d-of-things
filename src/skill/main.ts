// The skill's page (skill.html): the site's fonts, its own stylesheet, the live watch at the top,
// the install line's copy button, and a masthead that names the section in view.
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './skill.css';
import { mountLive } from './live';

const live = document.querySelector<HTMLElement>('.live');
if (live) mountLive(live);

// Copies the text of the element its data-copy names, and says so for a moment. Where the
// clipboard is out of reach, it selects the text instead, ready to copy by hand.
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  let reset = 0;
  button.addEventListener('click', async () => {
    const source = document.querySelector(button.dataset.copy!);
    if (!source) return;
    const copied = await navigator.clipboard?.writeText(source.textContent ?? '').then(() => true, () => false);
    if (!copied) {
      const range = document.createRange();
      range.selectNodeContents(source);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
    }
    button.textContent = copied ? 'Copied' : 'Selected';
    clearTimeout(reset);
    reset = window.setTimeout(() => (button.textContent = 'Copy'), 1600);
  });
}

const sections = [...document.querySelectorAll<HTMLElement>('main section[id]')];
const here = document.querySelector<HTMLElement>('.masthead__section');

// A section counts as in view while it crosses a line a third of the way down the window.
const inView = new Set<HTMLElement>();
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) inView.add(entry.target as HTMLElement);
      else inView.delete(entry.target as HTMLElement);
    }
    const section = sections.find((s) => inView.has(s));
    if (here) here.textContent = section?.querySelector('h2')?.textContent ?? '';
  },
  { rootMargin: '-33% 0px -66% 0px' },
);
for (const section of sections) observer.observe(section);
