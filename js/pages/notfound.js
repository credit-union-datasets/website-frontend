import { el, mount } from '../render.js';

export default async function notFoundPage(container) {
  const wrap = el('div', { className: 'container' });

  const content = el('div', { className: 'not-found reveal' }, [
    el('div', { className: 'not-found__code' }, '404'),
    el('div', { className: 'not-found__message' }, 'This page does not exist.'),
    el('a', { className: 'not-found__link', href: '#/hysa' }, '← Back to HYSA Dashboard')
  ]);

  mount(wrap, content);
  mount(container, wrap);
}
