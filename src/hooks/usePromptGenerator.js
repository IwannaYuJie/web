import { useState, useCallback } from 'react'
import { generateRandomPrompt as apiGenerateRandomPrompt, optimizePrompt as apiOptimizePrompt } from '../utils'

/**
 * 提示词生成和优化 Hook
 */
export function usePromptGenerator() {
  const [randomLoading, setRandomLoading] = useState(false)
  const [optimizeLoading, setOptimizeLoading] = useState(false)

  // 生成随机提示词
  const generateRandomPrompt = useCallback(async (currentInput = '') => {
    setRandomLoading(true)
    try {
      const prompt = await apiGenerateRandomPrompt(currentInput)
      return prompt
    } catch (err) {
      console.error('随机提示词生成失败:', err)
      throw new Error('😿 随机提示词生成失败，请稍后重试')
    } finally {
      setRandomLoading(false)
    }
  }, [])

  // 优化提示词
  const optimizePrompt = useCallback(async (input) => {
    if (!input?.trim()) {
      throw new Error('😿 先写点想法再让我优化吧')
    }

    setOptimizeLoading(true)
    try {
      const prompt = await apiOptimizePrompt(input)
      return prompt
    } catch (err) {
      console.error('提示词优化失败:', err)
      throw new Error('😿 提示词优化失败，请稍后重试')
    } finally {
      setOptimizeLoading(false)
    }
  }, [])

  return {
    randomLoading,
    optimizeLoading,
    generateRandomPrompt,
    optimizePrompt
  }
}
