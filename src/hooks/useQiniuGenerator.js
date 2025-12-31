import { useState, useRef, useCallback } from 'react'
import { normalizeImages, callQiniuTextToImage, callQiniuImageToImage } from '../utils'

/**
 * 七牛图像生成 Hook
 * 封装七牛文生图和图生图的核心逻辑
 */
export function useQiniuGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [usage, setUsage] = useState(null)
  const abortControllerRef = useRef(null)

  // 取消请求
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    setError('已取消本次七牛请求')
    setUsage(null)
  }, [])

  // 重置状态
  const reset = useCallback(() => {
    setLoading(false)
    setError('')
    setImages([])
    setUsage(null)
  }, [])

  // 文生图
  const generateTextToImage = useCallback(async (payload, keyChoice = 'auto') => {
    setLoading(true)
    setError('')
    setImages([])
    setUsage(null)

    const controller = new AbortController()
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = controller

    try {
      const data = await callQiniuTextToImage(payload, keyChoice, controller.signal)
      const normalized = normalizeImages(data?.data)

      if (normalized.length === 0) {
        throw new Error('生成成功但未返回图片数据')
      }

      setImages(normalized)
      setUsage(data?.usage || null)
      return normalized
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('已取消本次七牛请求')
        return null
      }
      console.error('调用七牛文生图失败:', err)
      setError(err?.message || '七牛文生图调用失败')
      return null
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  // 图生图
  const generateImageToImage = useCallback(async (payload, keyChoice = 'auto') => {
    setLoading(true)
    setError('')
    setImages([])
    setUsage(null)

    const controller = new AbortController()
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = controller

    try {
      const data = await callQiniuImageToImage(payload, keyChoice, controller.signal)
      const normalized = normalizeImages(data?.data)

      if (normalized.length === 0) {
        throw new Error('生成成功但未返回图片数据')
      }

      setImages(normalized)
      setUsage(data?.usage || null)
      return normalized
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('已取消本次七牛请求')
        return null
      }
      console.error('调用七牛图生图失败:', err)
      setError(err?.message || '七牛图生图调用失败')
      return null
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  return {
    loading,
    error,
    setError,
    images,
    setImages,
    usage,
    reset,
    cancelRequest,
    generateTextToImage,
    generateImageToImage
  }
}
