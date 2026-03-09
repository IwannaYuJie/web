import { useEffect, useState } from 'react'

export function useIntervalValue(initialValue, createNextValue, delay) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (!Number.isFinite(delay) || delay <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setValue((previousValue) => createNextValue(previousValue))
    }, delay)

    return () => window.clearInterval(timer)
  }, [createNextValue, delay])

  return [value, setValue]
}
