import { el, mount } from '../render.js';
import { query } from '../db.js';
import { createHysaCard } from '../components/card.js';
import { formatNumber } from '../utils/format.js';

export default async function hysaPage(container) {
  const wrap = el('div', { className: 'container' });
  const cleanups = [];

  // Fetch HYSA products sorted by APY descending
  const products = query(`
    SELECT h.*, n.credit_union_name, n.city, n.state
    FROM hysa h
    JOIN ncua_ n ON h.charter_number = n.charter_number
    ORDER BY CAST(REPLACE(h.apy, '%', '') AS REAL) DESC
  `);

  // Stats
  const totalCUs = query('SELECT COUNT(*) as count FROM ncua_')[0].count;
  const hysaCount = products.length;
  const statesCount = query('SELECT COUNT(DISTINCT state) FROM ncua_')[0]['COUNT(DISTINCT state)'];

  // Last updated: most recent last_updated from hysa
  const lastUpdated = products.length > 0 ? products[0].last_updated : 'N/A';

  // Hero
  const hero = el('div', { className: 'hysa-hero reveal' }, [
    el('h1', { className: 'hysa-hero__title' }, 'High-Yield Savings Rates'),
    el('p', { className: 'hysa-hero__subtitle' }, 'Credit union HYSA products ranked by annual percentage yield.'),
    el('div', { className: 'hysa-hero__updated' }, `Last updated ${lastUpdated}`)
  ]);

  // Stats strip
  const stats = el('div', { className: 'stats-strip reveal', style: { animationDelay: '100ms' } }, [
    el('div', { className: 'stats-strip__item' }, [
      el('span', { className: 'stats-strip__value' }, formatNumber(totalCUs)),
      el('span', { className: 'stats-strip__label' }, 'Credit Unions Tracked')
    ]),
    el('div', { className: 'stats-strip__item' }, [
      el('span', { className: 'stats-strip__value' }, String(hysaCount)),
      el('span', { className: 'stats-strip__label' }, 'HYSA Products')
    ]),
    el('div', { className: 'stats-strip__item' }, [
      el('span', { className: 'stats-strip__value' }, String(statesCount)),
      el('span', { className: 'stats-strip__label' }, 'States & Territories')
    ]),
  ]);

  // Leaderboard
  const leaderboard = el('div', { className: 'hysa-leaderboard reveal-stagger' });

  for (let i = 0; i < products.length; i++) {
    const { element, cleanup } = createHysaCard(products[i], i + 1);
    leaderboard.appendChild(element);
    cleanups.push(cleanup);
  }

  mount(wrap, hero, stats, leaderboard);
  mount(container, wrap);

  // Return cleanup function
  return () => {
    cleanups.forEach(fn => fn());
  };
}
