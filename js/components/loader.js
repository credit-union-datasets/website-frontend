import { el, mount } from '../render.js';

/**
 * Render skeleton loading placeholders into a container.
 */
export function renderSkeletonCards(container, count = 5) {
  const wrap = el('div', { className: 'container' });
  for (let i = 0; i < count; i++) {
    wrap.appendChild(el('div', { className: 'skeleton skeleton--card' }));
  }
  mount(container, wrap);
}

export function renderSkeletonRows(container, count = 10) {
  const wrap = el('div', { className: 'container' });
  for (let i = 0; i < count; i++) {
    wrap.appendChild(el('div', { className: 'skeleton skeleton--row' }));
  }
  mount(container, wrap);
}
