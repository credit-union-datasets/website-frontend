import { initDB } from './db.js';
import { register, startRouter } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import hysaPage from './pages/hysa.js';
import browsePage from './pages/browse.js';
import detailPage from './pages/detail.js';
import notFoundPage from './pages/notfound.js';

async function boot() {
  try {
    // Load sql.js from CDN
    await loadScript('https://sql.js.org/dist/sql-wasm.js');

    // Initialize database
    await initDB();

    // Render shell
    renderHeader();
    renderFooter();

    // Register routes
    register('/', hysaPage);
    register('/hysa', hysaPage);
    register('/browse', browsePage);
    register('/detail/:charter_number', detailPage);
    register('*', notFoundPage);

    // Start routing
    startRouter();
  } catch (err) {
    console.error('Boot failed:', err);
    const app = document.getElementById('app');
    while (app.firstChild) app.removeChild(app.firstChild);
    const msg = document.createElement('div');
    msg.className = 'container';
    msg.style.paddingTop = '4rem';
    msg.style.textAlign = 'center';
    const p = document.createElement('p');
    p.className = 'text-secondary';
    p.textContent = 'Failed to load the database. Please try refreshing.';
    msg.appendChild(p);
    const pre = document.createElement('pre');
    pre.className = 'mono text-xs text-muted';
    pre.style.marginTop = '1rem';
    pre.textContent = err.message;
    msg.appendChild(pre);
    app.appendChild(msg);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

boot();
