const routes = {};
let currentCleanup = null;

export function register(pattern, handler) {
  routes[pattern] = handler;
}

export function navigate(hash) {
  window.location.hash = hash;
}

function parseHash() {
  const hash = window.location.hash.slice(1) || '/hysa';
  const [path, qs] = hash.split('?');
  const params = new URLSearchParams(qs || '');
  return { path, params };
}

function matchRoute(path) {
  // Exact match first
  if (routes[path]) return { handler: routes[path], params: {} };

  // Pattern matching for /detail/:id
  for (const pattern of Object.keys(routes)) {
    const parts = pattern.split('/');
    const pathParts = path.split('/');

    if (parts.length !== pathParts.length) continue;

    const routeParams = {};
    let match = true;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) {
        routeParams[parts[i].slice(1)] = pathParts[i];
      } else if (parts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler: routes[pattern], params: routeParams };
  }

  return null;
}

async function handleRoute() {
  const app = document.getElementById('app');
  const { path, params: queryParams } = parseHash();
  const match = matchRoute(path);

  // Run cleanup for previous page
  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  // Exit animation
  app.classList.add('page-exit');
  await new Promise(r => setTimeout(r, 150));

  // Clear existing children safely using DOM methods
  while (app.firstChild) {
    app.removeChild(app.firstChild);
  }
  app.classList.remove('page-exit');

  if (match) {
    const routeParams = { ...match.params };
    for (const [k, v] of queryParams) {
      routeParams[k] = v;
    }
    currentCleanup = await match.handler(app, routeParams);
  } else if (routes['*']) {
    currentCleanup = await routes['*'](app, {});
  }

  app.classList.add('page-enter');
  app.addEventListener('animationend', () => {
    app.classList.remove('page-enter');
  }, { once: true });

  window.scrollTo(0, 0);
}

export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
