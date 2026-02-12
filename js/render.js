/**
 * Create a DOM element with attributes, classes, and children.
 * All text content is set via textContent (safe from XSS).
 * For elements needing child nodes, pass them as children array.
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'className') {
      element.className = value;
    } else if (key === 'text') {
      element.textContent = value;
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(value)) {
        element.dataset[dk] = dv;
      }
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  }

  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    for (const child of children) {
      if (child == null) continue;
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}

export function mount(parent, ...elements) {
  for (const element of elements) {
    if (element != null) {
      parent.appendChild(element);
    }
  }
}

export function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
