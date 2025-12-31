import { useState, useEffect, useRef } from 'react'

/**
 * 搜索框组件
 * 带有防抖和清空功能
 */
function SearchBox({
  value,
  onChange,
  placeholder = '搜索文章...',
  debounceMs = 300,
  className = ''
}) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef(null)
  const inputRef = useRef(null)

  // 同步外部值变化
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // 防抖处理
  const handleChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }

  // 清空搜索
  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
        🔍
      </div>

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-xl border border-border-color bg-white/70 focus:bg-white focus:border-primary focus:shadow-md outline-none transition-all"
      />

      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-color transition-colors p-1"
          title="清空搜索"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default SearchBox
