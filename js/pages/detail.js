import { el, mount } from '../render.js';
import { query } from '../db.js';
import { titleCase } from '../utils/format.js';
import { createEligibilityPill } from '../components/pill.js';

export default async function detailPage(container, routeParams) {
  const charterNumber = routeParams.charter_number || routeParams.id;
  const wrap = el('div', { className: 'container' });

  // Back link
  const back = el('a', { className: 'detail-back', href: '#/browse' }, '← Back to Browse');

  // Fetch data
  const cu = query('SELECT * FROM ncua_ WHERE charter_number = ?', [charterNumber]);

  if (cu.length === 0) {
    mount(wrap,
      back,
      el('div', { className: 'not-found', style: { marginTop: '4rem' } }, [
        el('div', { className: 'not-found__code' }, '?'),
        el('div', { className: 'not-found__message' }, `No credit union found with charter #${charterNumber}`)
      ])
    );
    mount(container, wrap);
    return;
  }

  const cuData = cu[0];
  const website = query('SELECT * FROM website WHERE charter_number = ?', [charterNumber]);
  const hysa = query('SELECT * FROM hysa WHERE charter_number = ?', [charterNumber]);
  const membership = query('SELECT * FROM membership WHERE charter_number = ?', [charterNumber]);

  // Header
  const header = el('div', { className: 'detail-header reveal' }, [
    el('div', { className: 'detail-charter mono' }, `CHARTER #${cuData.charter_number}`),
    el('h1', { className: 'detail-name' }, titleCase(cuData.credit_union_name)),
    el('div', { className: 'detail-location' },
      `${titleCase(cuData.city || '')}, ${cuData.state || ''}`
    ),
  ]);

  // Website section
  let websiteSection = null;
  if (website.length > 0 && website[0].url) {
    websiteSection = el('div', { className: 'detail-section reveal', style: { animationDelay: '100ms' } }, [
      el('div', { className: 'detail-section__title' }, 'Website'),
      el('a', {
        className: 'ext-link',
        href: website[0].url,
        target: '_blank',
        rel: 'noopener'
      }, website[0].url)
    ]);
  }

  // HYSA section
  let hysaSection = null;
  if (hysa.length > 0) {
    const h = hysa[0];
    hysaSection = el('div', { className: 'detail-section reveal', style: { animationDelay: '150ms' } }, [
      el('div', { className: 'detail-section__title' }, 'High-Yield Savings Account'),
      el('div', { className: 'detail-section__apy mono' }, h.apy),
      el('div', { className: 'detail-section__row' }, [
        el('span', { className: 'detail-section__label' }, 'Product'),
        el('span', { className: 'detail-section__value' }, h.product)
      ]),
      el('div', { className: 'detail-section__row' }, [
        el('span', { className: 'detail-section__label' }, 'Min Balance'),
        el('span', { className: 'detail-section__value mono' }, h.min_balance)
      ]),
      el('div', { className: 'detail-section__row' }, [
        el('span', { className: 'detail-section__label' }, 'Max Balance'),
        el('span', { className: 'detail-section__value mono' }, h.max_balance)
      ]),
      el('div', { className: 'detail-section__row' }, [
        el('span', { className: 'detail-section__label' }, 'Last Updated'),
        el('span', { className: 'detail-section__value mono' }, h.last_updated)
      ]),
      h.url
        ? el('div', { style: { marginTop: '1rem' } }, [
            el('a', {
              className: 'ext-link',
              href: h.url,
              target: '_blank',
              rel: 'noopener'
            }, 'View product page →')
          ])
        : null
    ]);
  }

  // Membership section
  let membershipSection = null;
  if (membership.length > 0) {
    const m = membership[0];
    const pill = createEligibilityPill(m.membership_eligibility);

    membershipSection = el('div', { className: 'detail-section reveal', style: { animationDelay: '200ms' } }, [
      el('div', { className: 'detail-section__title' }, 'Membership'),
      el('div', { style: { marginBottom: '0.75rem' } }, pill ? [pill] : []),
      m.membership_field
        ? el('div', { className: 'detail-membership-text' }, m.membership_field)
        : null,
      m.membership_url
        ? el('div', { style: { marginTop: '1rem' } }, [
            el('a', {
              className: 'ext-link',
              href: m.membership_url,
              target: '_blank',
              rel: 'noopener'
            }, 'Membership info →')
          ])
        : null,
      m.membership_notes
        ? el('div', {
            className: 'text-sm text-muted',
            style: { marginTop: '0.75rem', fontStyle: 'italic' }
          }, m.membership_notes)
        : null
    ]);
  }

  // Build grid for sections
  const hasRight = hysa.length > 0 || membership.length > 0;
  const hasLeft = website.length > 0;

  // No data available sections
  const noWebsite = !websiteSection
    ? el('div', { className: 'empty-state reveal', style: { animationDelay: '100ms' } }, 'No website data available')
    : null;
  const noHysa = !hysaSection
    ? el('div', { className: 'empty-state reveal', style: { animationDelay: '150ms' } }, 'No HYSA data available')
    : null;
  const noMembership = !membershipSection
    ? el('div', { className: 'empty-state reveal', style: { animationDelay: '200ms' } }, 'No membership data available')
    : null;

  const grid = el('div', { className: 'detail-grid' }, [
    el('div', { className: 'flex flex-col gap-6' }, [
      websiteSection || noWebsite,
      membershipSection || noMembership,
    ]),
    el('div', { className: 'flex flex-col gap-6' }, [
      hysaSection || noHysa,
    ])
  ]);

  mount(wrap, back, header, grid);
  mount(container, wrap);
}
