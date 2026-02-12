import { el, mount, clear } from '../render.js';
import { query } from '../db.js';
import { createSearchBar } from '../components/search.js';
import { createTable, createMobileCards } from '../components/table.js';
import { createPagination } from '../components/pagination.js';

const PAGE_SIZE = 50;

export default async function browsePage(container, routeParams) {
  const wrap = el('div', { className: 'container' });

  const initialQ = routeParams.q || '';
  const initialState = routeParams.state || '';
  const initialEligibility = routeParams.eligibility || 'all';
  const initialPage = parseInt(routeParams.page, 10) || 1;

  let currentPage = initialPage;
  let currentSort = { col: 'credit_union_name', dir: 'asc' };

  // Header
  const header = el('div', { className: 'browse-header reveal' }, [
    el('h1', { className: 'browse-header__title' }, 'Browse Credit Unions')
  ]);

  // Results area
  const resultsInfo = el('div', { className: 'browse-results-info' });
  const tableWrap = el('div', { className: 'browse-table-wrap' });
  const mobileCardsWrap = el('div');
  const paginationWrap = el('div');

  // Search bar
  const { element: searchBar, getFilters } = createSearchBar({
    onFilter: (filters) => {
      currentPage = 1;
      updateURL(filters, currentPage);
      renderResults(filters);
    },
    initialQuery: initialQ,
    initialState: initialState,
    initialEligibility: initialEligibility
  });

  mount(wrap, header, searchBar, resultsInfo, tableWrap, mobileCardsWrap, paginationWrap);
  mount(container, wrap);

  function buildQuery(filters, countOnly = false) {
    const select = countOnly
      ? 'SELECT COUNT(*) as count'
      : `SELECT n.charter_number, n.credit_union_name, n.city, n.state,
              (w.url IS NOT NULL) as has_website,
              (m.charter_number IS NOT NULL) as has_membership,
              (h.charter_number IS NOT NULL) as has_hysa`;

    let sql = `${select}
      FROM ncua_ n
      LEFT JOIN website w ON n.charter_number = w.charter_number
      LEFT JOIN membership m ON n.charter_number = m.charter_number
      LEFT JOIN hysa h ON n.charter_number = h.charter_number`;

    const conditions = [];
    const params = [];

    if (filters.q) {
      conditions.push(`(n.credit_union_name LIKE ? OR CAST(n.charter_number AS TEXT) LIKE ?)`);
      params.push(`%${filters.q}%`, `%${filters.q}%`);
    }

    if (filters.state) {
      conditions.push('n.state = ?');
      params.push(filters.state);
    }

    if (filters.eligibility === 'open') {
      conditions.push(`m.membership_eligibility = 'open'`);
    } else if (filters.eligibility === 'limited') {
      conditions.push(`m.membership_eligibility = 'limited'`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (!countOnly) {
      const sortCol = currentSort.col;
      const sortDir = currentSort.dir.toUpperCase();
      // Whitelist sort columns to prevent injection
      const validCols = ['charter_number', 'credit_union_name', 'city', 'state', 'has_website', 'has_membership', 'has_hysa'];
      const safeCol = validCols.includes(sortCol) ? sortCol : 'credit_union_name';
      const safeDir = sortDir === 'DESC' ? 'DESC' : 'ASC';

      // Prefix table alias for base columns
      const colNeedsAlias = ['charter_number', 'credit_union_name', 'city', 'state'];
      const orderCol = colNeedsAlias.includes(safeCol) ? `n.${safeCol}` : safeCol;

      sql += ` ORDER BY ${orderCol} ${safeDir}`;
      sql += ` LIMIT ${PAGE_SIZE} OFFSET ${(currentPage - 1) * PAGE_SIZE}`;
    }

    return { sql, params };
  }

  function renderResults(filters) {
    // Get count
    const { sql: countSql, params: countParams } = buildQuery(filters, true);
    const totalRows = query(countSql, countParams)[0].count;
    const totalPages = Math.ceil(totalRows / PAGE_SIZE);

    // Get page of data
    const { sql, params } = buildQuery(filters, false);
    const rows = query(sql, params);

    // Results info
    clear(resultsInfo);
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalRows);
    const infoText = totalRows > 0
      ? `Showing ${start}–${end} of ${totalRows}`
      : 'No results found';
    if (filters.eligibility !== 'all') {
      resultsInfo.appendChild(
        document.createTextNode(`${infoText} (filtering by membership data — ${query('SELECT COUNT(*) as c FROM membership')[0].c} CUs have eligibility info)`)
      );
    } else {
      resultsInfo.textContent = infoText;
    }

    // Desktop table
    clear(tableWrap);
    const table = createTable(rows, {
      sortCol: currentSort.col,
      sortDir: currentSort.dir,
      onSort: (col) => {
        if (currentSort.col === col) {
          currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.col = col;
          currentSort.dir = 'asc';
        }
        renderResults(getFilters());
      }
    });
    tableWrap.appendChild(table);

    // Mobile cards
    clear(mobileCardsWrap);
    mobileCardsWrap.appendChild(createMobileCards(rows));

    // Pagination
    clear(paginationWrap);
    paginationWrap.appendChild(createPagination({
      currentPage,
      totalPages,
      totalRows,
      onPage: (page) => {
        currentPage = page;
        const f = getFilters();
        updateURL(f, page);
        renderResults(f);
        window.scrollTo(0, 0);
      }
    }));
  }

  function updateURL(filters, page) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.state) params.set('state', filters.state);
    if (filters.eligibility !== 'all') params.set('eligibility', filters.eligibility);
    if (page > 1) params.set('page', page);
    const qs = params.toString();
    const hash = '/browse' + (qs ? '?' + qs : '');
    // Replace state to avoid polluting history with every keystroke
    history.replaceState(null, '', '#' + hash);
  }

  // Initial render
  renderResults(getFilters());
}
