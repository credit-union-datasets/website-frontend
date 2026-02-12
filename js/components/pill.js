import { el } from '../render.js';

/**
 * Create an eligibility badge pill.
 */
export function createEligibilityPill(eligibility) {
  if (!eligibility) return null;

  const label = eligibility.charAt(0).toUpperCase() + eligibility.slice(1);
  const className = eligibility === 'open'
    ? 'pill pill--open'
    : 'pill pill--limited';

  return el('span', { className }, label);
}
