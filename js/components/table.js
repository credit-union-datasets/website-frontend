import { el, clear } from '../render.js';
import { titleCase } from '../utils/format.js';
import { navigate } from '../router.js';

/**
 * Create a sortable data table for browsing credit unions.
 * Columns: Charter #, Name, City, State, Website, Membership, HYSA
 */
export function createTable(rows, { onSort, sortCol, sortDir }) {
  const columns = [
    { key: 'charter_number', label: 'Charter #', mono: true },
    { key: 'credit_union_name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'has_website', label: 'Web', dot: true },
    { key: 'has_membership', label: 'Membership', dot: true },
    { key: 'has_hysa', label: 'HYSA', dot: true },
  ];

  const thead = el('thead', {}, [
    el('tr', {}, columns.map(col => {
      const isSorted = sortCol === col.key;
      const arrow = isSorted ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
      const th = el('th', {
        className: isSorted ? 'sorted' : '',
        onClick: () => onSort(col.key)
      }, [
        document.createTextNode(col.label),
        el('span', { className: 'sort-arrow' }, arrow)
      ]);
      return th;
    }))
  ]);

  const tbody = el('tbody');

  for (const row of rows) {
    const tr = el('tr', {
      onClick: () => navigate(`#/detail/${row.charter_number}`)
    }, [
      el('td', { className: 'mono' }, String(row.charter_number)),
      el('td', { className: 'font-medium' }, titleCase(row.credit_union_name)),
      el('td', {}, titleCase(row.city || '')),
      el('td', {}, row.state || ''),
      el('td', {}, [el('span', { className: `dot ${row.has_website ? 'dot--active' : ''}` })]),
      el('td', {}, [el('span', { className: `dot ${row.has_membership ? 'dot--active' : ''}` })]),
      el('td', {}, [el('span', { className: `dot ${row.has_hysa ? 'dot--active' : ''}` })]),
    ]);
    tbody.appendChild(tr);
  }

  const table = el('table', { className: 'data-table' }, [thead, tbody]);
  return table;
}

/**
 * Create mobile card list for browse page.
 */
export function createMobileCards(rows) {
  const container = el('div', { className: 'browse-cards' });

  for (const row of rows) {
    const card = el('div', {
      className: 'browse-card',
      onClick: () => navigate(`#/detail/${row.charter_number}`)
    }, [
      el('div', { className: 'browse-card__name' }, titleCase(row.credit_union_name)),
      el('div', { className: 'browse-card__meta' },
        `${titleCase(row.city || '')}, ${row.state || ''}`
      ),
      el('div', { className: 'browse-card__charter mono' }, `#${row.charter_number}`),
      el('div', { className: 'browse-card__dots' }, [
        el('span', { className: `dot ${row.has_website ? 'dot--active' : ''}` }),
        el('span', { className: 'browse-card__dot-label' }, 'Web'),
        el('span', { className: `dot ${row.has_membership ? 'dot--active' : ''}` }),
        el('span', { className: 'browse-card__dot-label' }, 'Membership'),
        el('span', { className: `dot ${row.has_hysa ? 'dot--active' : ''}` }),
        el('span', { className: 'browse-card__dot-label' }, 'HYSA'),
      ])
    ]);
    container.appendChild(card);
  }

  return container;
}
