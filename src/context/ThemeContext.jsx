import { createContext, useContext, useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'cat_blog_theme_style'

export const THEMES = [
  {
    id: 'paper',
    name: '暖纸经典',
    icon: '📜',
    desc: '温暖燕麦纸底 · 柿子橙书卷风',
    colors: ['#F7F1E3', '#F2570A', '#221A10'],
  },
  {
    id: 'sketch',
    name: '手绘手账',
    icon: '✏️',
    desc: '白底方格稿纸 · 快乐体彩色便签',
    colors: ['#FFFFFF', '#2563EB', '#FFDF00'],
  },
  {
    id: 'cyberpunk',
    name: '赛博霓虹',
    icon: '🌆',
    desc: '黑曜石暗夜 · 霓虹粉青发光科技',
    colors: ['#090D16', '#FF007F', '#00F0FF'],
  },
  {
    id: 'pixel',
    name: '像素复古',
    icon: '👾',
    desc: '8-Bit 经典街机 · 阶梯直角方块',
    colors: ['#E3ECC8', '#2B7A0B', '#D90429'],
  },
  {
    id: 'y2k',
    name: '千禧酸性',
    icon: '💿',
    desc: '镭射浅紫渐变 · 酸性绿晶莹气泡',
    colors: ['#F5EEFE', '#7C3AED', '#A3E635'],
  },
]

const VALID_THEME_IDS = THEMES.map(t => t.id)

const ThemeContext = createContext({
  theme: 'paper',
  currentThemeConfig: THEMES[0],
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved && VALID_THEME_IDS.includes(saved)) {
        return saved
      }
    } catch {
      // ignore
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

  const setTheme = (newTheme) => {
    if (VALID_THEME_IDS.includes(newTheme)) {
      setThemeState(newTheme)
    }
  }

  const currentThemeConfig = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <ThemeContext.Provider value={{ theme, currentThemeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
