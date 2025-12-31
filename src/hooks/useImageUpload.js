import { useState, useRef, useCallback, useEffect } from 'react'
import { fileToDataUrl } from '../utils'

/**
 * 图片上传管理 Hook
 * @param {boolean} multiple - 是否支持多图上传
 */
export function useImageUpload(multiple = false) {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState('')
  const [uploadedImages, setUploadedImages] = useState([]) // 多图模式
  const inputRef = useRef(null)

  // 清理预览 URL
  useEffect(() => {
    return () => {
      if (uploadedImagePreview) {
        URL.revokeObjectURL(uploadedImagePreview)
      }
    }
  }, [uploadedImagePreview])

  // 移除单图
  const removeUploadedImage = useCallback(() => {
    setUploadedImage(null)
    setUploadedImagePreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return ''
    })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  // 单图上传处理
  const handleSingleUpload = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) {
      removeUploadedImage()
      return
    }
    // 清理旧的预览 URL
    setUploadedImagePreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return URL.createObjectURL(file)
    })
    setUploadedImage(file)
  }, [removeUploadedImage])

  // 多图上传处理
  const handleMultipleUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) {
      return
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)))
      const formatted = files.map((file, index) => ({
        name: file.name,
        size: file.size,
        dataUrl: dataUrls[index]
      }))
      setUploadedImages((prev) => [...prev, ...formatted])
    } catch (err) {
      console.error('转换图像失败:', err)
      throw err
    } finally {
      if (event.target) {
        event.target.value = ''
      }
    }
  }, [])

  // 移除多图中的某一张
  const removeUploadedImageAt = useCallback((index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // 清空所有多图
  const clearAllUploadedImages = useCallback(() => {
    setUploadedImages([])
  }, [])

  // 根据模式返回不同的处理函数
  const handleUpload = multiple ? handleMultipleUpload : handleSingleUpload

  return {
    // 单图模式
    uploadedImage,
    uploadedImagePreview,
    // 多图模式
    uploadedImages,
    // 通用
    inputRef,
    handleUpload,
    removeUploadedImage,
    removeUploadedImageAt,
    clearAllUploadedImages
  }
}
