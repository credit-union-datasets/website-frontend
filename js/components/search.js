import { el } from '../render.js';
import { debounce } from '../utils/debounce.js';
import { query } from '../db.js';

/**
 * Create the search and filter bar for the browse page.
 * Returns { element, getFilters }
 */
export function createSearchBar({ onFilter, initialQuery, initialState, initialEligibility }) {
  // Get distinct states for dropdown
  const states = query('SELECT DISTINCT state FROM ncua_ WHERE state IS NOT NULL ORDER BY state');

  const searchInput = el('input', {
    className: 'search-input',
    type: 'text',
    placeholder: 'Search credit unions by name or charter #...',
    value: initialQuery || ''
  });

  const searchIcon = el('span', { className: 'search-wrap__icon' }, '⌕');

  const searchWrap = el('div', { className: 'search-wrap' }, [
    searchIcon,
    searchInput
  ]);

  // State select
  const stateSelect = el('select', { className: 'select' }, [
    el('option', { value: '' }, 'All States'),
    ...states.map(s => {
      const opt = el('option', { value: s.state }, s.state);
      if (s.state === initialState) opt.selected = true;
      return opt;
    })
  ]);

  // Eligibility pills
  const eligibilityOptions = ['all', 'open', 'limited'];
  const currentEligibility = initialEligibility || 'all';

  const pills = eligibilityOptions.map(opt => {
    const isActive = opt === currentEligibility;
    const pill = el('button', {
      className: `pill ${isActive ? 'pill--active' : ''}`,
      dataset: { eligibility: opt }
    }, opt.charAt(0).toUpperCase() + opt.slice(1));

    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-eligibility]').forEach(p => {
        p.classList.remove('pill--active');
      });
      pill.classList.add('pill--active');
      triggerFilter();
    });

    return pill;
  });

  const eligibilityWrap = el('div', { className: 'browse-eligibility' }, [
    el('span', { className: 'text-xs text-muted', style: { marginRight: '0.25rem' } }, 'Eligibility:'),
    ...pills
  ]);

  const bar = el('div', { className: 'browse-filters' }, [
    searchWrap,
    stateSelect,
    eligibilityWrap
  ]);

  function getFilters() {
    const activePill = document.querySelector('[data-eligibility].pill--active');
    return {
      q: searchInput.value.trim(),
      state: stateSelect.value,
      eligibility: activePill ? activePill.dataset.eligibility : 'all'
    };
  }

  function triggerFilter() {
    onFilter(getFilters());
  }

  const debouncedFilter = debounce(triggerFilter, 250);
  searchInput.addEventListener('input', debouncedFilter);
  stateSelect.addEventListener('change', triggerFilter);

  return { element: bar, getFilters };
}
