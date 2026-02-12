import { el, mount } from '../render.js';

export function renderFooter() {
  const footer = document.getElementById('site-footer');
  while (footer.firstChild) footer.removeChild(footer.firstChild);

  const inner = el('div', { className: 'container site-footer__inner' }, [
    el('span', { className: 'site-footer__text' }, 'Credit Union Data Project — Open source, community-driven data.'),
    el('div', { className: 'site-footer__links' }, [
      el('a', {
        className: 'site-footer__link',
        href: 'https://github.com/atsaloli/credit-union-datasets',
        target: '_blank',
        rel: 'noopener'
      }, 'GitHub'),
      el('span', { className: 'site-footer__link' }, 'Data from NCUA')
    ])
  ]);

  mount(footer, inner);
}
