import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/main.css';
import { prefersReducedMotion, type Page } from './dom';
import { about } from './pages/about';
import { gallery } from './pages/gallery';
import { missing } from './pages/missing';
import { thingPage } from './pages/thing';
import { parseHash, type Route } from './router';

const main = document.getElementById('main')!;
let current: { route: Route; page: Page } | null = null;
let firstRender = true;
const scrollPositions = new Map<string, number>();

async function mount(route: Route): Promise<Page> {
  switch (route.page) {
    case 'gallery':
      return gallery(main, route, { entering: firstRender });
    case 'thing':
      // The page itself is light; it pulls in three.js once its poster is showing.
      return thingPage(main, route.slug);
    case 'about':
      return about(main);
    case 'capture':
      if (import.meta.env.DEV) return (await import('./pages/capture')).capture(main);
      return missing(main);
    default:
      return missing(main);
  }
}

const routeKey = (route: Route) => JSON.stringify(route);

async function render(): Promise<void> {
  const route = parseHash(location.hash);
  if (!route) return; // an in-page anchor, not a route
  if (current && current.route.page === route.page && current.page.update?.(route)) {
    current.route = route;
    return;
  }
  if (current) scrollPositions.set(routeKey(current.route), scrollY);
  // From one object to another the models hand over in 3D, so the page itself just swaps (a view
  // transition would freeze the canvas while it plays).
  const handover = current?.route.page === 'thing' && route.page === 'thing';

  const swap = async () => {
    current?.page.destroy?.(route);
    main.replaceChildren();
    const page = await mount(route);
    current = { route, page };
    document.title = page.title;
    for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-nav]')) {
      if (link.dataset.nav === route.page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    scrollTo(0, scrollPositions.get(routeKey(route)) ?? 0);
  };

  if (!firstRender && !handover && document.startViewTransition && !prefersReducedMotion()) {
    await document.startViewTransition(swap).updateCallbackDone;
  } else {
    await swap();
  }
  main.toggleAttribute('data-handover', handover);
  // Move focus to the new page's heading so keyboard and screen-reader users land in the right place.
  if (!firstRender) main.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  firstRender = false;
}

addEventListener('hashchange', () => void render());
void render();

document.querySelector('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault(); // a plain #main link would replace the route in the hash
  main.focus();
});
