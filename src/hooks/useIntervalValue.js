import { useEffect, useRef, useState } from 'react'

export function useIntervalValue(initialValue, createNextValue, delay) {
  const [value, setValue] = useState(initialValue)
  const createNextValueRef = useRef(createNextValue)

  useEffect(() => {
    createNextValueRef.current = createNextValue
  }, [createNextValue])

  useEffect(() => {
    if (!Number.isFinite(delay) || delay <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setValue((previousValue) => createNextValueRef.current(previousValue))
    }, delay)

    return () => window.clearInterval(timer)
  }, [delay])

  return [value, setValue]
}
