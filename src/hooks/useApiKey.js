import { useState, useEffect, useCallback } from 'react'

/**
 * API Key 本地存储管理 Hook
 * @param {string} storageKey - localStorage 的 key
 * @returns {Object} - API Key 状态和操作方法
 */
export function useApiKey(storageKey) {
  const [apiKey, setApiKey] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  // 初始化时读取已保存的 API Key
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setApiKey(stored)
      }
    } catch (error) {
      console.error('读取本地 API Key 失败:', error)
    }
  }, [storageKey])

  // 保存 API Key 到本地存储
  const saveKey = useCallback(() => {
    try {
      if (!apiKey.trim()) {
        setSaveMessage('😿 请先填写 API Key 再保存')
        return false
      }
      localStorage.setItem(storageKey, apiKey.trim())
      setSaveMessage('😺 API Key 已安全保存到本地')
      return true
    } catch (error) {
      setSaveMessage('😿 保存失败，请检查浏览器权限')
      console.error('保存 API Key 失败:', error)
      return false
    }
  }, [apiKey, storageKey])

  // 清除本地保存的 API Key
  const clearKey = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setApiKey('')
      setSaveMessage('🐾 已移除本地保存的 API Key')
      return true
    } catch (error) {
      setSaveMessage('😿 清除失败，请稍后再试')
      console.error('移除 API Key 失败:', error)
      return false
    }
  }, [storageKey])

  return {
    apiKey,
    setApiKey,
    saveMessage,
    setSaveMessage,
    saveKey,
    clearKey
  }
}
