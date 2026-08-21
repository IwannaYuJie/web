import { createContext, useContext, useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'cat_blog_theme_style'

const ThemeContext = createContext({
  theme: 'paper',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved === 'sketch' || saved === 'paper') {
        return saved
      }
    } catch {
      // ignore localStorage errors
    }
    return 'paper'
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'sketch' ? 'paper' : 'sketch'))
  }

  const setTheme = (newTheme) => {
    if (newTheme === 'sketch' || newTheme === 'paper') {
      setThemeState(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
