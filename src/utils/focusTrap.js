const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return []
  }
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (!el || el.hasAttribute?.('disabled')) {
      return false
    }
    if (el.getAttribute?.('aria-hidden') === 'true') {
      return false
    }
    return true
  })
}

export function trapFocusOnTab(event, container) {
  if (!event || event.key !== 'Tab' || !container) {
    return
  }
  const focusable = getFocusableElements(container)
  if (focusable.length === 0) {
    event.preventDefault()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = typeof document !== 'undefined' ? document.activeElement : null

  if (event.shiftKey) {
    if (!active || active === first || !container.contains?.(active)) {
      event.preventDefault()
      last.focus?.()
    }
    return
  }

  if (!active || active === last || !container.contains?.(active)) {
    event.preventDefault()
    first.focus?.()
  }
}

export function restoreFocus(element) {
  if (!element || typeof element.focus !== 'function') {
    return
  }
  if (element.isConnected === false) {
    return
  }
  try {
    element.focus({ preventScroll: true })
  } catch {
    element.focus()
  }
}
