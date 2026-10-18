// The skill's page (skill.html): the site's fonts, its own stylesheet, and a masthead
// that names the section in view while the contents mark it.
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './skill.css';

const sections = [...document.querySelectorAll<HTMLElement>('section[data-n]')];
const here = document.querySelector<HTMLElement>('.masthead__section');
const links = new Map([...document.querySelectorAll<HTMLAnchorElement>('.toc a')].map((a) => [a.hash.slice(1), a]));

function show(section: HTMLElement | null) {
  for (const [id, link] of links) {
    if (id === section?.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  if (here) here.textContent = section ? `${section.dataset.n} ${section.querySelector('h2')?.lastChild?.textContent ?? ''}` : '';
}

// A section counts as in view while it crosses a line a third of the way down the window.
const inView = new Set<HTMLElement>();
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) inView.add(entry.target as HTMLElement);
      else inView.delete(entry.target as HTMLElement);
    }
    show(sections.find((s) => inView.has(s)) ?? null);
  },
  { rootMargin: '-33% 0px -66% 0px' },
);
for (const section of sections) observer.observe(section);
