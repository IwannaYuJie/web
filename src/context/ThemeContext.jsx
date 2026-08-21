import { createContext, useContext, useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'cat_blog_theme_style'

export const THEMES = [
  {
    id: 'paper',
    name: '暖纸经典',
    icon: '📜',
    desc: '燕麦米黄纸底 · 柿子橙书卷风',
    colors: ['#F6EEDB', '#E8590C', '#221A10'],
  },
  {
    id: 'sketch',
    name: '手绘手账',
    icon: '✏️',
    desc: '白底蓝图网格 · 快乐体剪贴簿',
    colors: ['#FFFFFF', '#2563EB', '#FFDF00'],
  },
  {
    id: 'cyberpunk',
    name: '赛博霓虹',
    icon: '🌆',
    desc: '纯黑曜石暗夜 · 霓虹粉青发光HUD',
    colors: ['#080C14', '#FF007F', '#00F0FF'],
  },
  {
    id: 'pixel',
    name: '像素街机',
    icon: '👾',
    desc: 'GameBoy灰绿底 · 0px直角阶梯',
    colors: ['#9BBC0F', '#0F380F', '#8BAC0F'],
  },
  {
    id: 'y2k',
    name: '酸性千禧',
    icon: '⚡',
    desc: '高饱和电光黄 · 新野兽派黑黄撞色',
    colors: ['#E6FF00', '#000000', '#7C3AED'],
  },
  {
    id: 'matrix',
    name: '黑客帝国',
    icon: '🟢',
    desc: '纯黑极客终端 · 荧光绿代码流',
    colors: ['#000000', '#00FF41', '#008F11'],
  },
  {
    id: 'bubble',
    name: '多巴胺果冻',
    icon: '🫧',
    desc: '马卡龙粉紫渐变 · 40px气泡Q弹',
    colors: ['#FFF0F5', '#FF6B81', '#70A1FF'],
  },
  {
    id: 'blueprint',
    name: '工业蓝图',
    icon: '📐',
    desc: 'CAD制图深蓝底 · 白色工程标尺',
    colors: ['#0B3B60', '#E0F2FE', '#38BDF8'],
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
