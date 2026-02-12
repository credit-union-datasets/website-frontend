import { el, mount } from '../render.js';

export function renderHeader() {
  const header = document.getElementById('site-header');
  while (header.firstChild) header.removeChild(header.firstChild);

  const inner = el('div', { className: 'container site-header__inner' }, [
    el('a', { className: 'site-header__logo', href: '#/hysa' }, [
      document.createTextNode('Credit Union '),
      el('span', {}, 'Data')
    ]),
    el('nav', { className: 'site-nav' }, [
      el('a', { className: 'site-nav__link', href: '#/hysa', dataset: { nav: 'hysa' } }, 'HYSA Rates'),
      el('a', { className: 'site-nav__link', href: '#/browse', dataset: { nav: 'browse' } }, 'Browse CUs'),
    ])
  ]);

  mount(header, inner);
  updateActiveNav();

  window.addEventListener('hashchange', updateActiveNav);
}

function updateActiveNav() {
  const hash = window.location.hash.slice(1) || '/hysa';
  const links = document.querySelectorAll('.site-nav__link');
  links.forEach(link => {
    const nav = link.dataset.nav;
    const isActive = hash.startsWith('/' + nav);
    link.classList.toggle('site-nav__link--active', isActive);
  });
}
