/**
 * Convert ALL CAPS text to Title Case.
 * Handles common small words (of, the, and, etc.) correctly.
 */
const SMALL_WORDS = new Set(['of', 'the', 'and', 'in', 'for', 'to', 'at', 'by', 'a', 'an', 'or']);

export function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !SMALL_WORDS.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Format a number with commas.
 */
export function formatNumber(n) {
  return Number(n).toLocaleString();
}

/**
 * Animate a number counting up from 0 to target.
 * Returns a cleanup function.
 */
export function countUp(element, target, duration = 800) {
  const start = performance.now();
  let rafId;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = (target * eased).toFixed(2);
    element.textContent = current + '%';

    if (progress < 1) {
      rafId = requestAnimationFrame(update);
    } else {
      element.textContent = target.toFixed(2) + '%';
      element.classList.add('apy-counted');
    }
  }

  rafId = requestAnimationFrame(update);
  return () => cancelAnimationFrame(rafId);
}
