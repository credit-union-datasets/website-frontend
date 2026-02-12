import { el } from '../render.js';
import { titleCase, countUp } from '../utils/format.js';

/**
 * Create an HYSA leaderboard card.
 * Returns { element, cleanup } where cleanup cancels the count-up animation.
 */
export function createHysaCard(data, rank) {
  const apyNum = parseFloat(data.apy.replace('%', ''));

  const apyEl = el('div', { className: 'hysa-card__apy mono' }, '0.00%');

  const infoCol = el('div', {}, [
    el('div', { className: 'hysa-card__name' }, titleCase(data.credit_union_name)),
    el('div', { className: 'hysa-card__meta' }, `${titleCase(data.city)}, ${data.state}`),
    el('div', { className: 'hysa-card__product' }, data.product),
    el('div', { className: 'hysa-card__balance mono' },
      `${data.min_balance} – ${data.max_balance}`
    ),
  ]);

  const linkCol = el('div', { style: { textAlign: 'right', alignSelf: 'start' } }, [
    apyEl,
    data.url
      ? el('a', {
          className: 'hysa-card__link',
          href: data.url,
          target: '_blank',
          rel: 'noopener'
        }, 'View product →')
      : null,
    el('a', {
      className: 'hysa-card__link',
      href: `#/detail/${data.charter_number}`,
      style: { display: 'block', marginTop: '0.5rem' }
    }, 'CU details →')
  ]);

  const card = el('div', { className: 'hysa-card' }, [
    el('div', { className: 'hysa-card__rank mono' }, `#${rank}`),
    infoCol,
    linkCol,
  ]);

  // Start count-up after a brief delay based on rank
  let cancelCountUp;
  const timeoutId = setTimeout(() => {
    cancelCountUp = countUp(apyEl, apyNum, 800);
  }, rank * 80);

  const cleanup = () => {
    clearTimeout(timeoutId);
    if (cancelCountUp) cancelCountUp();
  };

  return { element: card, cleanup };
}
