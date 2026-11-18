export const COLOR_MODE_STORAGE_KEY = 'orange_cat_color_mode'

export function hasStoredColorMode() {
  try {
    const saved = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    return saved === 'light' || saved === 'dark'
  } catch {
    return false
  }
}

export function resolveInitialColorMode() {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-color-mode')
    if (attr === 'light' || attr === 'dark') {
      return attr
    }
  }

  try {
    const saved = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // ignore storage errors
  }

  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyColorMode(mode) {
  const normalized = mode === 'dark' ? 'dark' : 'light'
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-color-mode', normalized)
    const meta = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', normalized === 'dark' ? '#0D1216' : '#F4EFE4')
    }
  }
  return normalized
}

export function persistColorMode(mode) {
  const normalized = applyColorMode(mode)
  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, normalized)
  } catch {
    // ignore storage errors
  }
  return normalized
}

export function subscribeSystemColorMode(onChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (!mediaQuery) {
    return () => {}
  }

  const handleChange = (event) => {
    if (!hasStoredColorMode()) {
      onChange(event.matches ? 'dark' : 'light')
    }
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }
  if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }
  return () => {}
}
