import { useState, useCallback } from 'react'
import { fal } from '@fal-ai/client'
import { normalizeImages, sendEmailNotification } from '../utils'

/**
 * Fal.ai 图像生成 Hook
 * 封装 Fal.ai Seedream 和 Z-Image 的核心逻辑
 */
export function useFalGenerator(apiKey) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState([])
  const [resultSeed, setResultSeed] = useState('')

  // 重置状态
  const reset = useCallback(() => {
    setLoading(false)
    setError('')
    setImages([])
    setResultSeed('')
  }, [])

  // 获取模型 ID
  const getModelId = useCallback((modelType, mode) => {
    const isEditMode = mode === 'edit'

    switch (modelType) {
      case 'v4':
        return isEditMode
          ? 'fal-ai/bytedance/seedream/v4/edit'
          : 'fal-ai/bytedance/seedream/v4/text-to-image'
      case 'v4.5':
        return isEditMode
          ? 'fal-ai/bytedance/seedream/v4.5/edit'
          : 'fal-ai/bytedance/seedream/v4.5/text-to-image'
      case 'z-image-turbo':
        return isEditMode
          ? 'fal-ai/z-image/turbo/image-to-image'
          : 'fal-ai/z-image/turbo'
      case 'new':
      default:
        return isEditMode
          ? 'fal-ai/gemini-3-pro-image-preview/edit'
          : 'fal-ai/gemini-3-pro-image-preview'
    }
  }, [])

  // 生成图片
  const generate = useCallback(async (modelType, mode, inputPayload, sendEmail = true) => {
    if (!apiKey?.trim()) {
      setError('😿 请先填写 Fal.ai API Key')
      return null
    }

    setLoading(true)
    setError('')
    setImages([])
    setResultSeed('')

    try {
      fal.config({ credentials: apiKey.trim() })

      const modelId = getModelId(modelType, mode)
      console.log(`[${modelType}] 使用模型: ${modelId}`)
      console.log(`[${modelType}] 输入参数:`, inputPayload)

      const result = await fal.subscribe(modelId, {
        input: inputPayload,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('生成中:', update.logs)
          }
        }
      })

      console.log('Fal.ai 完整返回结果:', result)

      const emailSource = mode === 'edit' ? 'fal-edit' : 'fal-text'

      if (!result) {
        setError('😿 没有收到返回结果，请稍后重试')
        if (sendEmail) {
          sendEmailNotification(false, null, '没有收到返回结果', inputPayload.prompt, emailSource)
        }
        return null
      }

      const resultData = result.data || result
      const imageList = resultData.images
      const seedValue = resultData.seed

      if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
        setError('😿 生成成功但没有返回图像，请检查控制台日志')
        console.error('图片数据异常 - 完整结果:', JSON.stringify(result, null, 2))
        if (sendEmail) {
          sendEmailNotification(false, null, '生成成功但没有返回图像', inputPayload.prompt, emailSource)
        }
        return null
      }

      setResultSeed(seedValue ? String(seedValue) : '')
      const normalizedImages = normalizeImages(imageList)

      if (normalizedImages.length === 0) {
        setError('😿 图片格式转换失败，请检查控制台日志')
        console.error('所有图片转换后为空，原始数据:', imageList)
        if (sendEmail) {
          sendEmailNotification(false, null, '图片格式转换失败', inputPayload.prompt, emailSource)
        }
        return null
      }

      setImages(normalizedImages)

      if (sendEmail) {
        sendEmailNotification(true, imageList, null, inputPayload.prompt, emailSource)
      }

      return normalizedImages
    } catch (err) {
      console.error('调用 Fal 失败:', err)
      const errorMsg = err?.message || '发生未知错误'
      setError(errorMsg.startsWith('😿') ? errorMsg : `😿 ${errorMsg}`)

      if (sendEmail) {
        const emailSource = mode === 'edit' ? 'fal-edit' : 'fal-text'
        sendEmailNotification(false, null, errorMsg, inputPayload.prompt, emailSource)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [apiKey, getModelId])

  // 快速生成（用于 Coser 等场景，不发邮件）
  const quickGenerate = useCallback(async (prompt, imageSize = 'auto_4K') => {
    if (!apiKey?.trim()) {
      throw new Error('请先填写 Fal.ai API Key')
    }

    fal.config({ credentials: apiKey.trim() })

    const inputPayload = {
      prompt,
      image_size: imageSize,
      num_images: 1,
      sync_mode: false,
      enable_safety_checker: false
    }

    const result = await fal.subscribe('fal-ai/bytedance/seedream/v4/text-to-image', {
      input: inputPayload,
      logs: true
    })

    const resultData = result.data || result
    const imageList = resultData.images

    if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
      throw new Error('Fal 未返回图像')
    }

    const firstImage = imageList[0]
    if (firstImage?.url) {
      return { src: firstImage.url, downloadName: 'fal_image.png' }
    }

    const base64 = firstImage?.base64 || firstImage?.b64_json || firstImage?.content
    if (base64) {
      return { src: `data:image/png;base64,${base64}`, downloadName: 'fal_image.png' }
    }

    throw new Error('Fal 图片格式无法识别')
  }, [apiKey])

  return {
    loading,
    error,
    setError,
    images,
    setImages,
    resultSeed,
    reset,
    generate,
    quickGenerate,
    getModelId
  }
}
