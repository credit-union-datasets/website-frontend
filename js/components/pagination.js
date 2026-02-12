import { el } from '../render.js';

/**
 * Create pagination controls.
 * Returns the pagination element.
 */
export function createPagination({ currentPage, totalPages, totalRows, onPage }) {
  if (totalPages <= 1) {
    return el('div', { className: 'pagination' }, [
      el('span', { className: 'pagination__info' }, `${totalRows} results`)
    ]);
  }

  const items = [];

  // Previous button
  items.push(el('button', {
    className: 'pagination__btn',
    disabled: currentPage === 1 ? 'true' : undefined,
    onClick: () => { if (currentPage > 1) onPage(currentPage - 1); }
  }, '←'));

  // Page numbers: show first, last, current ± 1, and ellipses
  const pages = getPaginationRange(currentPage, totalPages);

  for (const p of pages) {
    if (p === '...') {
      items.push(el('span', { className: 'pagination__info' }, '…'));
    } else {
      items.push(el('button', {
        className: `pagination__btn ${p === currentPage ? 'pagination__btn--active' : ''}`,
        onClick: () => onPage(p)
      }, String(p)));
    }
  }

  // Next button
  items.push(el('button', {
    className: 'pagination__btn',
    disabled: currentPage === totalPages ? 'true' : undefined,
    onClick: () => { if (currentPage < totalPages) onPage(currentPage + 1); }
  }, '→'));

  items.push(el('span', { className: 'pagination__info' }, `${totalRows} results`));

  return el('div', { className: 'pagination' }, items);
}

function getPaginationRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
