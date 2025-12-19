import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fal } from '@fal-ai/client'
import './SeedreamStudio.css'

/**
 * SeedreamStudio 页面组件
 * 提供 Fal.ai Seedream v4 文生图体验，支持参数定制与结果预览
 * 新增随机 Coser 写真一键生成功能
 */
function SeedreamStudio() {
  const storageKey = 'seedream-fal-key'
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [sizePreset, setSizePreset] = useState('auto_4K')
  const [customWidth, setCustomWidth] = useState('1024')
  const [customHeight, setCustomHeight] = useState('1024')
  const [numImages, setNumImages] = useState(1)
  const [seed, setSeed] = useState('')
  const [syncMode, setSyncMode] = useState(false)
  const [safetyChecker, setSafetyChecker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultSeed, setResultSeed] = useState('')
  const [images, setImages] = useState([])
  const [saveMessage, setSaveMessage] = useState('')
  const [mode, setMode] = useState('text')
  const [imageInputMethod, setImageInputMethod] = useState('upload')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState('')
  const [imageUrlsText, setImageUrlsText] = useState('')
  const [controlScale, setControlScale] = useState(0.7)
  const [showApiKeyPanel, setShowApiKeyPanel] = useState(false)
  const [showParamsPanel, setShowParamsPanel] = useState(false)
  const [showQiniuParamsPanel, setShowQiniuParamsPanel] = useState(false)
  const [activeApi, setActiveApi] = useState('qiniu')
  const [playgroundMode, setPlaygroundMode] = useState('list') // 'list' | 'random-coser'
  
  // 新增模型选择与参数状态
  const [modelType, setModelType] = useState('v4') // 'v4' | 'v4.5' | 'new' | 'z-image-turbo'
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('2K')
  const [outputFormat, setOutputFormat] = useState('png')
  const [numInferenceSteps, setNumInferenceSteps] = useState(8)
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(false)
  const [acceleration, setAcceleration] = useState('none')
  const [zImageStrength, setZImageStrength] = useState(0.6)

  // 七牛文生图参数
  const [qiniuModel, setQiniuModel] = useState('gemini-3.0-pro-image-preview')
  const [qiniuPrompt, setQiniuPrompt] = useState('')
  const [qiniuCount, setQiniuCount] = useState(1)
  const [qiniuImageSize, setQiniuImageSize] = useState('2K')
  const [qiniuQuality, setQiniuQuality] = useState('')
  const [qiniuStyle, setQiniuStyle] = useState('vivid')
  const [qiniuTemperature, setQiniuTemperature] = useState('0.8')
  const [qiniuTopP, setQiniuTopP] = useState('0.95')
  const [qiniuTopK, setQiniuTopK] = useState('50')
  const [qiniuNegativePrompt, setQiniuNegativePrompt] = useState('')
  const [qiniuImageUrl, setQiniuImageUrl] = useState('')
  const [qiniuImageReference, setQiniuImageReference] = useState('')
  const [qiniuImageFidelity, setQiniuImageFidelity] = useState('0.5')
  const [qiniuHumanFidelity, setQiniuHumanFidelity] = useState('0.45')
  const [qiniuAspectRatio, setQiniuAspectRatio] = useState('')
  const [qiniuLoading, setQiniuLoading] = useState(false)
  const [qiniuError, setQiniuError] = useState('')
  const [qiniuImages, setQiniuImages] = useState([])
  const [qiniuUsage, setQiniuUsage] = useState(null)
  const [qiniuMode, setQiniuMode] = useState('text')
  const [qiniuImageUploads, setQiniuImageUploads] = useState([])
  const [qiniuMaskText, setQiniuMaskText] = useState('')
  const [qiniuMaskUpload, setQiniuMaskUpload] = useState('')
  const [qiniuMaskFileName, setQiniuMaskFileName] = useState('')
  const [qiniuBackground, setQiniuBackground] = useState('auto')
  const [qiniuInputFidelity, setQiniuInputFidelity] = useState('high')
  const [qiniuOutputFormatSetting, setQiniuOutputFormatSetting] = useState('png')
  const [qiniuOutputCompression, setQiniuOutputCompression] = useState('90')
  const [qiniuResponseFormat, setQiniuResponseFormat] = useState('b64_json')
  const [qiniuStream, setQiniuStream] = useState(false)
  const [showQiniuAdvancedPanel, setShowQiniuAdvancedPanel] = useState(false)
  const [qiniuKeyChoice, setQiniuKeyChoice] = useState('auto')

  // 随机 Coser 功能状态
  const [coserLoading, setCoserLoading] = useState(false)
  const [coserPromptLoading, setCoserPromptLoading] = useState(false)
  const [coserError, setCoserError] = useState('')
  const [coserPrompt, setCoserPrompt] = useState('')
  const [coserFalImage, setCoserFalImage] = useState(null)
  const [coserQiniuImage, setCoserQiniuImage] = useState(null)
  const [coserStep, setCoserStep] = useState('')
  const [coserUserInput, setCoserUserInput] = useState('')  // 用户自定义输入
  const [coserFalLoading, setCoserFalLoading] = useState(false)  // Fal 单独加载状态
  const [coserQiniuLoading, setCoserQiniuLoading] = useState(false)  // 七牛单独加载状态
  const [randomPromptLoading, setRandomPromptLoading] = useState(false) // 随机提示词加载状态
  const [optimizePromptLoading, setOptimizePromptLoading] = useState(false) // 提示词优化加载状态

  const inputImageRef = useRef(null)
  const qiniuAbortControllerRef = useRef(null)

  /**
   * 生成随机提示词（用于 Fal 和 七牛 面板）
   * @param {string} target - 'fal' | 'qiniu'
   */
  const handleGenerateRandomPrompt = async (target) => {
    setRandomPromptLoading(true)
    // 清除之前的错误信息
    if (target === 'fal') setError('')
    else setQiniuError('')

    // 获取当前输入框的内容作为基础
    let currentInput = ''
    if (target === 'fal') {
      currentInput = prompt
    } else if (target === 'qiniu') {
      currentInput = qiniuPrompt
    }

    try {
      const response = await fetch('/api/coser-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: currentInput }) // 将当前输入作为用户需求传给 API
      })

      if (!response.ok) {
        throw new Error('提示词生成服务响应异常')
      }

      const data = await response.json()
      const generatedPrompt = data?.prompt

      if (!generatedPrompt) {
        throw new Error('未能获取到有效的提示词')
      }

      if (target === 'fal') {
        setPrompt(generatedPrompt)
      } else if (target === 'qiniu') {
        setQiniuPrompt(generatedPrompt)
      }
    } catch (err) {
      console.error('随机提示词生成失败:', err)
      const errorMsg = '😿 随机提示词生成失败，请稍后重试'
      if (target === 'fal') setError(errorMsg)
      else setQiniuError(errorMsg)
    } finally {
      setRandomPromptLoading(false)
    }
  }

  /**
   * 根据输入内容优化提示词（仅在已有输入时可用）
   * @param {string} target - 'fal' | 'qiniu'
   */
  const handleOptimizePrompt = async (target) => {
    const currentInput = target === 'fal' ? prompt : qiniuPrompt
    const trimmedInput = currentInput.trim()

    if (!trimmedInput) {
      const emptyMessage = '😿 先写点想法再让我优化吧'
      if (target === 'fal') setError(emptyMessage)
      else setQiniuError(emptyMessage)
      return
    }

    setOptimizePromptLoading(true)
    if (target === 'fal') setError('')
    else setQiniuError('')

    try {
      const response = await fetch('/api/coser-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: trimmedInput })
      })

      if (!response.ok) {
        throw new Error('提示词优化服务响应异常')
      }

      const data = await response.json()
      const optimizedPrompt = data?.prompt

      if (!optimizedPrompt) {
        throw new Error('未能获取到优化后的提示词')
      }

      if (target === 'fal') {
        setPrompt(optimizedPrompt)
      } else {
        setQiniuPrompt(optimizedPrompt)
      }
    } catch (err) {
      console.error('提示词优化失败:', err)
      const errorMsg = '😿 提示词优化失败，请稍后重试'
      if (target === 'fal') setError(errorMsg)
      else setQiniuError(errorMsg)
    } finally {
      setOptimizePromptLoading(false)
    }
  }

  /**
   * 初始化时尝试读取已保存的 API Key
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setApiKey(stored)
      }
    } catch (storageError) {
      console.error('读取本地 API Key 失败:', storageError)
    }
  }, [])

  useEffect(() => () => {
    if (uploadedImagePreview) {
      URL.revokeObjectURL(uploadedImagePreview)
    }
  }, [uploadedImagePreview])

  // 当切换模型时，重置和适配参数
  const prevModelTypeRef = useRef(modelType)
  useEffect(() => {
    // 只在模型真正切换时才重置参数，避免初始化时触发
    if (prevModelTypeRef.current !== modelType) {
      if (modelType === 'z-image-turbo') {
        // Z-Image Turbo 默认参数
        setSizePreset('auto')
        setNumInferenceSteps(8)
        setAcceleration('none')
        setOutputFormat('png')
        setEnablePromptExpansion(false)
      } else if (modelType === 'v4' || modelType === 'v4.5') {
        // Seedream v4/v4.5 默认参数
        setSizePreset('auto_4K')
      } else if (modelType === 'new') {
        // Gemini 3 Pro 默认参数
        setAspectRatio('1:1')
        setResolution('2K')
        setOutputFormat('png')
      }
      prevModelTypeRef.current = modelType
    }
  }, [modelType])

  /**
   * 根据当前选择构建 Fal API 所需的尺寸参数
   */
  const imageSizeInput = useMemo(() => {
    if (sizePreset === 'custom') {
      return {
        width: Number.parseInt(customWidth, 10),
        height: Number.parseInt(customHeight, 10)
      }
    }
    return sizePreset
  }, [sizePreset, customWidth, customHeight])

  const controlScaleNumber = useMemo(() => {
    const value = Number.parseFloat(String(controlScale))
    if (Number.isNaN(value)) {
      return 0.7
    }
    return value
  }, [controlScale])

  /**
   * 将 Fal 返回的图片对象转换为组件可消费的统一格式
   */
  const normalizeImages = (imageList = []) => {
    if (!Array.isArray(imageList)) {
      console.warn('图片列表不是数组:', imageList)
      return []
    }
    
    return imageList.map((item, index) => {
      console.log(`处理图片 ${index + 1}:`, item)
      
      // 优先使用 url 字段
      if (item?.url) {
        console.log(`图片 ${index + 1} 使用 URL 模式:`, item.url)
        return {
          src: item.url,
          downloadName: item.file_name || `seedream_${index + 1}.png`
        }
      }

      // 其次尝试 base64 格式
      const base64 = item?.base64 || item?.b64_json || item?.content || ''
      if (base64) {
        console.log(`图片 ${index + 1} 使用 Base64 模式`)
        return {
          src: `data:image/png;base64,${base64}`,
          downloadName: item?.file_name || `seedream_${index + 1}.png`
        }
      }

      console.warn('无法识别的图片格式:', item)
      return null
    }).filter(Boolean)
  }

  /**
   * 发送邮件通知（Fal.ai 生成结果）
   * @param {boolean} success - 是否成功
   * @param {Array} images - 图片数组（成功时）
   * @param {string} error - 错误信息（失败时）
   * @param {string} promptText - 生成用的 prompt
   * @param {string} source - 来源标识 ('fal-text' | 'fal-edit')
   */
  const sendEmailNotification = async (success, images, error, promptText, source) => {
    try {
      await fetch('/api/notify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success,
          images: success ? images : undefined,
          error: success ? undefined : error,
          prompt: promptText,
          source
        })
      })
      console.log('邮件通知已发送')
    } catch (emailError) {
      console.error('发送邮件通知失败:', emailError)
    }
  }

  /**
   * 保存 API Key 到浏览器本地存储
   */
  const handleSaveKey = () => {
    try {
      if (!apiKey.trim()) {
        setSaveMessage('😿 请先填写 Fal.ai API Key 再保存')
        return
      }
      localStorage.setItem(storageKey, apiKey.trim())
      setSaveMessage('😺 API Key 已安全保存到本地')
    } catch (storageError) {
      setSaveMessage('😿 保存失败，请检查浏览器权限')
      console.error('保存 API Key 失败:', storageError)
    }
  }

  /**
   * 清除本地保存的 API Key
   */
  const handleClearKey = () => {
    try {
      localStorage.removeItem(storageKey)
      setApiKey('')
      setSaveMessage('🐾 已移除本地保存的 API Key')
    } catch (storageError) {
      setSaveMessage('😿 清除失败，请稍后再试')
      console.error('移除 API Key 失败:', storageError)
    }
  }

  /**
   * 生成随机种子
   */
  const handleRandomSeed = () => {
    setSeed(String(Math.floor(Math.random() * 9999999999)))
  }

  /**
   * 通用图片下载处理函数
   * 支持 URL 和 Base64 两种格式
   */
  const handleImageDownload = async (imageSrc, fileName) => {
    try {
      // 如果是 Base64 或 Data URL，直接下载
      if (imageSrc.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = imageSrc
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // 如果是 URL，需要先 fetch 转为 Blob
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理 Blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('下载图片失败:', err)
      // 降级处理：在新标签页打开
      window.open(imageSrc, '_blank')
    }
  }

  const handleApiSwitch = (nextApi) => {
    if (nextApi === activeApi) {
      return
    }
    setActiveApi(nextApi)
    setError('')
    setQiniuError('')
    setCoserError('')
    if (nextApi === 'playground') {
      setPlaygroundMode('list')
    }
  }

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) {
      return
    }
    setMode(nextMode)
    setError('')
    setImages([])
    setResultSeed('')
    if (nextMode === 'text') {
      handleRemoveUploadedImage()
      setImageUrlsText('')
      setImageInputMethod('upload')
    }
  }

  const handleImageInputMethodChange = (method) => {
    setImageInputMethod(method)
    setImageUrlsText('')
    if (method === 'urls') {
      handleRemoveUploadedImage()
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      handleRemoveUploadedImage()
      return
    }
    if (uploadedImagePreview) {
      URL.revokeObjectURL(uploadedImagePreview)
    }
    setUploadedImage(file)
    setUploadedImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveUploadedImage = () => {
    if (uploadedImagePreview) {
      URL.revokeObjectURL(uploadedImagePreview)
    }
    setUploadedImage(null)
    setUploadedImagePreview('')
    if (inputImageRef.current) {
      inputImageRef.current.value = ''
    }
  }

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleQiniuModeChange = (nextMode) => {
    if (nextMode === qiniuMode) {
      return
    }
    if (qiniuAbortControllerRef.current) {
      qiniuAbortControllerRef.current.abort()
      qiniuAbortControllerRef.current = null
    }
    setQiniuMode(nextMode)
    setQiniuError('')
    setQiniuImages([])
    setQiniuUsage(null)
    setQiniuLoading(false)
  }

  const handleQiniuImageUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) {
      return
    }
    const currentTarget = event.target
    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)))
      const formatted = files.map((file, index) => ({
        name: file.name,
        size: file.size,
        dataUrl: dataUrls[index]
      }))
      setQiniuImageUploads((prev) => [...prev, ...formatted])
    } catch (uploadError) {
      console.error('转换图像失败:', uploadError)
      setQiniuError(uploadError?.message || '😿 上传图像转换失败，请重试')
    } finally {
      if (currentTarget) {
        currentTarget.value = ''
      }
    }
  }

  const handleRemoveQiniuUpload = (indexToRemove) => {
    setQiniuImageUploads((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleQiniuMaskUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setQiniuMaskUpload('')
      setQiniuMaskFileName('')
      return
    }
    try {
      const dataUrl = await fileToDataUrl(file)
      setQiniuMaskUpload(dataUrl)
      setQiniuMaskFileName(file.name)
    } catch (maskError) {
      console.error('遮罩上传失败:', maskError)
      setQiniuError(maskError?.message || '遮罩文件转换失败')
    } finally {
      event.target.value = ''
    }
  }

  const handleClearMask = () => {
    setQiniuMaskUpload('')
    setQiniuMaskText('')
    setQiniuMaskFileName('')
  }

  // 组装七牛 image_config，仅在用户填写时返回对象
  const buildQiniuImageConfig = () => {
    const config = {}
    if (qiniuAspectRatio.trim()) {
      config.aspect_ratio = qiniuAspectRatio.trim()
    }
    if (qiniuImageSize.trim()) {
      config.image_size = qiniuImageSize.trim()
    }
    return Object.keys(config).length > 0 ? config : null
  }

  /**
   * 调用 Fal.ai Seedream v4 文生图能力
   */
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('😿 请先填写 Fal.ai API Key')
      return
    }

    if (!prompt.trim()) {
      setError('🐱 喵~ 描述内容不能为空哦')
      return
    }

    if (sizePreset === 'custom') {
      const widthValue = Number.parseInt(customWidth, 10)
      const heightValue = Number.parseInt(customHeight, 10)
      const sizeValid = [widthValue, heightValue].every(
        (value) => Number.isInteger(value) && value >= 1024 && value <= 4096
      )
      if (!sizeValid) {
        setError('😿 自定义尺寸需在 1024~4096 像素之间')
        return
      }
    }

    let presetUrlList = []
    if (mode === 'edit') {
      if (imageInputMethod === 'upload' && !uploadedImage) {
        setError('😿 改图模式需要先上传一张基础图像')
        return
      }
      if (imageInputMethod === 'urls') {
        presetUrlList = imageUrlsText
          .split('\n')
          .map((raw) => raw.trim())
          .filter(Boolean)
        if (presetUrlList.length === 0) {
          setError('😿 请提供至少一个有效的图像 URL')
          return
        }
      }
    }

    setError('')
    setLoading(true)
    setImages([])
    setResultSeed('')

    try {
      fal.config({ credentials: apiKey.trim() })

      let inputPayload = {}
      let modelId = ''

      if (modelType === 'v4' || modelType === 'v4.5') {
        inputPayload = {
          prompt: prompt.trim(),
          image_size: imageSizeInput,
          num_images: Number.parseInt(String(numImages), 10) || 1,
          sync_mode: syncMode,
          enable_safety_checker: safetyChecker
        }

        if (seed.trim()) {
          const parsedSeed = Number.parseInt(seed.trim(), 10)
          if (!Number.isNaN(parsedSeed)) {
            inputPayload.seed = parsedSeed
          }
        }

        // v4 与 v4.5 统一使用相同的入参模板，避免旧版增强参数造成兼容问题
        const baseModelId = modelType === 'v4'
          ? 'fal-ai/bytedance/seedream/v4'
          : 'fal-ai/bytedance/seedream/v4.5'
        modelId = mode === 'edit'
          ? `${baseModelId}/edit`
          : `${baseModelId}/text-to-image`

        if (mode === 'edit') {
          inputPayload.control_scale = controlScaleNumber

          if (imageInputMethod === 'upload') {
            try {
              console.log('上传基础图像到 Fal 存储')
              setError('')
              const uploadedUrl = await fal.storage.upload(uploadedImage)
              inputPayload.image_urls = [uploadedUrl]
            } catch (uploadError) {
              console.error('上传基础图像失败:', uploadError)
              setError(uploadError?.message || '😿 上传基础图像失败，请稍后再试')
              setLoading(false)
              return
            }
          } else {
            inputPayload.image_urls = presetUrlList
          }
        }
      } else if (modelType === 'z-image-turbo') {
        // Z-Image Turbo 模型配置
        const isZImageEdit = mode === 'edit'
        modelId = isZImageEdit 
          ? 'fal-ai/z-image/turbo/image-to-image'
          : 'fal-ai/z-image/turbo'
        
        inputPayload = {
          prompt: prompt.trim(),
          image_size: imageSizeInput || (isZImageEdit ? 'auto' : 'landscape_4_3'),
          num_inference_steps: numInferenceSteps,
          num_images: Number.parseInt(String(numImages), 10) || 1,
          enable_safety_checker: safetyChecker,
          enable_prompt_expansion: enablePromptExpansion,
          output_format: outputFormat,
          acceleration: acceleration,
          sync_mode: syncMode
        }

        if (seed.trim()) {
          const parsedSeed = Number.parseInt(seed.trim(), 10)
          if (!Number.isNaN(parsedSeed)) {
            inputPayload.seed = parsedSeed
          }
        }

        // 图生图模式需要上传图像
        if (isZImageEdit) {
          inputPayload.strength = zImageStrength

          if (imageInputMethod === 'upload') {
            if (!uploadedImage) {
              setError('😿 图生图模式需要先上传一张基础图像')
              setLoading(false)
              return
            }
            try {
              console.log('上传基础图像到 Fal 存储 (Z-Image Turbo)')
              setError('')
              const uploadedUrl = await fal.storage.upload(uploadedImage)
              inputPayload.image_url = uploadedUrl
            } catch (uploadError) {
              console.error('上传基础图像失败:', uploadError)
              setError(uploadError?.message || '😿 上传基础图像失败，请稍后再试')
              setLoading(false)
              return
            }
          } else {
            if (presetUrlList.length === 0) {
              setError('😿 请提供至少一个有效的图像 URL')
              setLoading(false)
              return
            }
            inputPayload.image_url = presetUrlList[0]
          }
        }
      } else {
        // 新模型调用逻辑
        const isGeminiEditMode = mode === 'edit'
        // Gemini 3 Pro 的改图需要调用 /edit 端点，否则上传的 image_urls 会被忽略
        modelId = isGeminiEditMode
          ? 'fal-ai/gemini-3-pro-image-preview/edit'
          : 'fal-ai/gemini-3-pro-image-preview'

        inputPayload = {
          prompt: prompt.trim(),
          num_images: Number.parseInt(String(numImages), 10) || 1,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          sync_mode: syncMode,
          resolution: resolution
        }

        if (isGeminiEditMode) {
          if (imageInputMethod === 'upload') {
            if (!uploadedImage) {
              setError('😿 改图模式需要先上传一张基础图像')
              setLoading(false)
              return
            }
            try {
              console.log('上传基础图像到 Fal 存储')
              setError('')
              const uploadedUrl = await fal.storage.upload(uploadedImage)
              inputPayload.image_urls = [uploadedUrl]
            } catch (uploadError) {
              console.error('上传基础图像失败:', uploadError)
              setError(uploadError?.message || '😿 上传基础图像失败，请稍后再试')
              setLoading(false)
              return
            }
          } else {
            if (presetUrlList.length === 0) {
              setError('😿 请提供至少一个有效的图像 URL')
              setLoading(false)
              return
            }
            inputPayload.image_urls = presetUrlList
          }
        }
      }

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

      // 确定来源标识
      const emailSource = mode === 'edit' ? 'fal-edit' : 'fal-text'

      if (!result) {
        setError('😿 没有收到返回结果，请稍后重试')
        // 发送失败邮件
        sendEmailNotification(false, null, '没有收到返回结果', prompt.trim(), emailSource)
        return
      }

      // Fal.ai 返回格式: { data: { images: [...], seed: ... }, requestId: ... }
      const resultData = result.data || result
      const imageList = resultData.images
      const resultSeedValue = resultData.seed

      console.log('提取的图片数组:', imageList)
      console.log('图片数组是数组?', Array.isArray(imageList))
      console.log('图片数组长度:', imageList?.length)

      if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
        setError('😿 生成成功但没有返回图像，请检查控制台日志')
        console.error('图片数据异常 - 完整结果:', JSON.stringify(result, null, 2))
        // 发送失败邮件
        sendEmailNotification(false, null, '生成成功但没有返回图像', prompt.trim(), emailSource)
        return
      }

      setResultSeed(resultSeedValue ? String(resultSeedValue) : '')
      const normalizedImages = normalizeImages(imageList)
      console.log('转换后的图片列表:', normalizedImages)

      if (normalizedImages.length === 0) {
        setError('😿 图片格式转换失败，请检查控制台日志')
        console.error('所有图片转换后为空，原始数据:', imageList)
        // 发送失败邮件
        sendEmailNotification(false, null, '图片格式转换失败', prompt.trim(), emailSource)
        return
      }

      setImages(normalizedImages)
      // 发送成功邮件（传递原始 imageList，包含 url）
      sendEmailNotification(true, imageList, null, prompt.trim(), emailSource)
    } catch (generationError) {
      console.error('调用 Fal Seedream 失败:', generationError)
      const errorMsg = generationError?.message || '发生未知错误'
      setError(errorMsg.startsWith('😿') ? errorMsg : `😿 ${errorMsg}`)
      // 发送失败邮件
      const emailSource = mode === 'edit' ? 'fal-edit' : 'fal-text'
      sendEmailNotification(false, null, errorMsg, prompt.trim(), emailSource)
    } finally {
      setLoading(false)
    }
  }

  const handleQiniuTextGenerate = async () => {
    if (!qiniuPrompt.trim()) {
      setQiniuError('😿 请先输入 Prompt')
      return
    }

    const sanitizedCount = Math.min(10, Math.max(1, Number.parseInt(qiniuCount, 10) || 1))
    if (sanitizedCount !== qiniuCount) {
      setQiniuCount(sanitizedCount)
    }

    const payload = {
      model: qiniuModel.trim() || 'gemini-3.0-pro-image-preview',
      prompt: qiniuPrompt.trim(),
      n: sanitizedCount
    }

    const imageConfig = buildQiniuImageConfig()
    if (imageConfig) {
      payload.image_config = imageConfig
    }

    if (qiniuQuality) {
      payload.quality = qiniuQuality
    }

    if (qiniuStyle) {
      payload.style = qiniuStyle
    }

    const temperatureValue = Number.parseFloat(qiniuTemperature)
    if (!Number.isNaN(temperatureValue)) {
      payload.temperature = temperatureValue
    }

    const topPValue = Number.parseFloat(qiniuTopP)
    if (!Number.isNaN(topPValue)) {
      payload.top_p = topPValue
    }

    const topKValue = Number.parseInt(qiniuTopK, 10)
    if (!Number.isNaN(topKValue)) {
      payload.top_k = topKValue
    }

    const negative = qiniuNegativePrompt.trim()
    if (negative) {
      payload.negative_prompt = negative
    }

    const imageUrl = qiniuImageUrl.trim()
    if (imageUrl) {
      payload.image = imageUrl
    }

    const reference = qiniuImageReference.trim()
    if (reference) {
      try {
        payload.image_reference = JSON.parse(reference)
      } catch (parseError) {
        payload.image_reference = reference
      }
    }

    const fidelityValue = Number.parseFloat(qiniuImageFidelity)
    if (!Number.isNaN(fidelityValue)) {
      payload.image_fidelity = fidelityValue
    }

    const humanValue = Number.parseFloat(qiniuHumanFidelity)
    if (!Number.isNaN(humanValue)) {
      payload.human_fidelity = humanValue
    }

    // image_config 中已有比例与分辨率控制，避免旧字段重复

    setQiniuLoading(true)
    setQiniuError('')
    setQiniuImages([])
    setQiniuUsage(null)

    const controller = new AbortController()
    if (qiniuAbortControllerRef.current) {
      qiniuAbortControllerRef.current.abort()
    }
    qiniuAbortControllerRef.current = controller

    try {
      const response = await fetch('/api/qiniu-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Qiniu-Key': qiniuKeyChoice
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || data?.error || '七牛文生图调用失败'
        throw new Error(errorMsg)
      }

      const normalized = normalizeImages(data?.data)
      if (normalized.length === 0) {
        throw new Error('生成成功但未返回图片数据')
      }

      setQiniuImages(normalized)
      setQiniuUsage(data?.usage || null)
    } catch (generationError) {
      if (generationError.name === 'AbortError') {
        setQiniuError('已取消本次七牛请求')
        return
      }
      console.error('调用七牛文生图失败:', generationError)
      setQiniuError(generationError?.message || '七牛文生图调用失败')
    } finally {
      setQiniuLoading(false)
      qiniuAbortControllerRef.current = null
    }
  }

  const handleQiniuEditGenerate = async () => {
    if (!qiniuPrompt.trim()) {
      setQiniuError('😿 请先输入 Prompt')
      return
    }

    const sanitizedCount = Math.min(10, Math.max(1, Number.parseInt(qiniuCount, 10) || 1))
    if (sanitizedCount !== qiniuCount) {
      setQiniuCount(sanitizedCount)
    }

    const imageList = qiniuImageUploads.map((item) => item.dataUrl).filter(Boolean)

    if (imageList.length === 0) {
      setQiniuError('😿 请至少上传一张待编辑的图像')
      return
    }

    const payload = {
      model: qiniuModel.trim() || 'gemini-3.0-pro-image-preview',
      prompt: qiniuPrompt.trim(),
      n: sanitizedCount,
      image: imageList.length === 1 ? imageList[0] : imageList
    }

    const maskCandidate = qiniuMaskUpload || qiniuMaskText.trim()
    if (maskCandidate) {
      payload.mask = maskCandidate
    }

    const imageConfig = buildQiniuImageConfig()
    if (imageConfig) {
      payload.image_config = imageConfig
    }

    if (qiniuQuality) {
      payload.quality = qiniuQuality
    }

    if (qiniuStyle) {
      payload.style = qiniuStyle
    }

    if (qiniuBackground) {
      payload.background = qiniuBackground
    }

    if (qiniuInputFidelity) {
      payload.input_fidelity = qiniuInputFidelity
    }

    if (qiniuOutputFormatSetting) {
      payload.output_format = qiniuOutputFormatSetting
    }

    const compressionValue = Number.parseInt(qiniuOutputCompression, 10)
    if (!Number.isNaN(compressionValue)) {
      payload.output_compression = compressionValue
    }

    if (qiniuResponseFormat) {
      payload.response_format = qiniuResponseFormat
    }

    if (qiniuStream) {
      payload.stream = true
    }

    if (qiniuTopP) {
      const topPValue = Number.parseFloat(qiniuTopP)
      if (!Number.isNaN(topPValue)) {
        payload.top_p = topPValue
      }
    }

    if (qiniuTopK) {
      const topKValue = Number.parseInt(qiniuTopK, 10)
      if (!Number.isNaN(topKValue)) {
        payload.top_k = topKValue
      }
    }

    if (qiniuTemperature) {
      const tempValue = Number.parseFloat(qiniuTemperature)
      if (!Number.isNaN(tempValue)) {
        payload.temperature = tempValue
      }
    }

    const negative = qiniuNegativePrompt.trim()
    if (negative) {
      payload.negative_prompt = negative
    }

    const reference = qiniuImageReference.trim()
    if (reference) {
      try {
        payload.image_reference = JSON.parse(reference)
      } catch (parseError) {
        payload.image_reference = reference
      }
    }

    const imageUrl = qiniuImageUrl.trim()
    if (imageUrl) {
      payload.image_url = imageUrl
    }

    const fidelityValue = Number.parseFloat(qiniuImageFidelity)
    if (!Number.isNaN(fidelityValue)) {
      payload.image_fidelity = fidelityValue
    }

    const humanValue = Number.parseFloat(qiniuHumanFidelity)
    if (!Number.isNaN(humanValue)) {
      payload.human_fidelity = humanValue
    }

    // aspect_ratio 统一由 image_config 管控

    setQiniuLoading(true)
    setQiniuError('')
    setQiniuImages([])
    setQiniuUsage(null)

    const controller = new AbortController()
    if (qiniuAbortControllerRef.current) {
      qiniuAbortControllerRef.current.abort()
    }
    qiniuAbortControllerRef.current = controller

    try {
      const response = await fetch('/api/qiniu-image-edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Qiniu-Key': qiniuKeyChoice
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || data?.error || '七牛图生图调用失败'
        throw new Error(errorMsg)
      }

      const normalized = normalizeImages(data?.data)
      if (normalized.length === 0) {
        throw new Error('生成成功但未返回图片数据')
      }

      setQiniuImages(normalized)
      setQiniuUsage(data?.usage || null)
    } catch (generationError) {
      if (generationError.name === 'AbortError') {
        setQiniuError('已取消本次七牛请求')
        return
      }
      console.error('调用七牛图生图失败:', generationError)
      setQiniuError(generationError?.message || '七牛图生图调用失败')
    } finally {
      setQiniuLoading(false)
      qiniuAbortControllerRef.current = null
    }
  }

  const handleQiniuGenerate = () => {
    if (qiniuMode === 'edit') {
      return handleQiniuEditGenerate()
    }
    return handleQiniuTextGenerate()
  }

  const cancelQiniuRequest = () => {
    if (qiniuAbortControllerRef.current) {
      qiniuAbortControllerRef.current.abort()
      qiniuAbortControllerRef.current = null
    }
    setQiniuLoading(false)
    setQiniuError('已取消本次七牛请求')
    setQiniuUsage(null)
  }

  /**
   * 随机 Coser 写真一键生成
   * 1. 调用文本 API 生成随机提示词
   * 2. 同时调用 Fal Seedream v4 和七牛 Gemini 生图（即时展示）
   */
  const handleCoserGenerate = async () => {
    // 检查 Fal API Key
    if (!apiKey.trim()) {
      setCoserError('😿 请先在上方 Fal.ai 面板填写 API Key 才能使用双引擎生成')
      return
    }

    setCoserLoading(true)
    setCoserFalLoading(true)
    setCoserQiniuLoading(true)
    setCoserError('')
    setCoserPrompt('')
    setCoserFalImage(null)
    setCoserQiniuImage(null)
    setCoserStep('正在生成随机角色提示词...')

    try {
      // Step 1: 调用文本 API 生成随机提示词
      setCoserPromptLoading(true)
      const promptResponse = await fetch('/api/coser-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: coserUserInput.trim() })
      })

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json().catch(() => ({}))
        throw new Error(errorData?.message || errorData?.error || '提示词生成失败')
      }

      const promptData = await promptResponse.json()
      const generatedPrompt = promptData?.prompt

      if (!generatedPrompt) {
        throw new Error('未能生成有效的提示词')
      }

      setCoserPrompt(generatedPrompt)
      setCoserPromptLoading(false)
      setCoserStep('提示词已生成，正在调用双引擎生图...')

      // Step 2: 并行调用两个生图 API，即时展示结果
      // Fal 生图（独立处理，使用 auto_4K）
      generateFalImage(generatedPrompt)
        .then((result) => {
          setCoserFalImage(result)
          setCoserFalLoading(false)
        })
        .catch((error) => {
          console.error('Fal 生图失败:', error)
          setCoserFalLoading(false)
        })

      // 七牛生图（独立处理，使用默认设置）
      generateQiniuCoserImage(generatedPrompt)
        .then((result) => {
          setCoserQiniuImage(result)
          setCoserQiniuLoading(false)
        })
        .catch((error) => {
          console.error('七牛生图失败:', error)
          setCoserQiniuLoading(false)
        })

      // 提示词生成完成后，主 loading 状态改为等待图片
      setCoserStep('双引擎生图中，先完成的会先显示...')
      setCoserLoading(false)

    } catch (generationError) {
      console.error('随机 Coser 生成失败:', generationError)
      setCoserError(generationError?.message || '生成失败，请稍后重试')
      setCoserStep('')
      setCoserLoading(false)
      setCoserFalLoading(false)
      setCoserQiniuLoading(false)
      setCoserPromptLoading(false)
    }
  }

  /**
   * 使用 Fal Seedream v4 生成图片
   * @param {string} promptText - 提示词
   */
  const generateFalImage = async (promptText) => {
    try {
      fal.config({ credentials: apiKey.trim() })

      // 随机 Coser 也保持与 v4.5 相同的字段，防止旧参数触发接口校验
      const inputPayload = {
        prompt: promptText,
        image_size: 'auto_4K',
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
        return { src: firstImage.url, downloadName: 'coser_fal.png' }
      }
      
      const base64 = firstImage?.base64 || firstImage?.b64_json || firstImage?.content
      if (base64) {
        return { src: `data:image/png;base64,${base64}`, downloadName: 'coser_fal.png' }
      }

      throw new Error('Fal 图片格式无法识别')
    } catch (error) {
      console.error('Fal 生图异常:', error)
      throw error
    }
  }

  /**
   * 使用七牛 Gemini 3.0 Pro Image Preview 生成图片
   * @param {string} promptText - 提示词
   */
  const generateQiniuCoserImage = async (promptText) => {
    try {
      const payload = {
        model: 'gemini-3.0-pro-image-preview',
        prompt: promptText,
        n: 1,
        style: 'vivid',
        temperature: 0.8
      }

      const imageConfig = buildQiniuImageConfig()
      payload.image_config = imageConfig || { image_size: '2K' }

      const response = await fetch('/api/qiniu-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Qiniu-Key': qiniuKeyChoice },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || data?.error || '七牛生图调用失败'
        throw new Error(errorMsg)
      }

      const imageList = data?.data
      if (!imageList || !Array.isArray(imageList) || imageList.length === 0) {
        throw new Error('七牛未返回图像')
      }

      const firstImage = imageList[0]
      if (firstImage?.url) {
        return { src: firstImage.url, downloadName: 'coser_qiniu.png' }
      }

      const base64 = firstImage?.base64 || firstImage?.b64_json || firstImage?.content
      if (base64) {
        return { src: `data:image/png;base64,${base64}`, downloadName: 'coser_qiniu.png' }
      }

      throw new Error('七牛图片格式无法识别')
    } catch (error) {
      console.error('七牛生图异常:', error)
      throw error
    }
  }

  const isCustomSize = sizePreset === 'custom'

  return (
    <div className="seedream-page">
      <div className="container">
        <header className="seedream-header">
          <h1>🌅 Seedream AI 实验室</h1>
          <p>喵~ 自由切换 Fal.ai Seedream v4 与七牛 Gemini-3.0-Pro Image Preview，玩转橘猫灵感 ✨</p>
        </header>

        <div className="api-switch" role="tablist" aria-label="图像生成 API 切换">
          <button
            type="button"
            className={`api-switch-button${activeApi === 'fal' ? ' active' : ''}`}
            onClick={() => handleApiSwitch('fal')}
          >
            🧠 Fal.ai Seedream
          </button>
          <button
            type="button"
            className={`api-switch-button${activeApi === 'qiniu' ? ' active' : ''}`}
            onClick={() => handleApiSwitch('qiniu')}
          >
            🐧 七牛 Gemini
          </button>
          <button
            type="button"
            className={`api-switch-button coser-button${activeApi === 'playground' ? ' active' : ''}`}
            onClick={() => handleApiSwitch('playground')}
          >
            🎮 更多玩法
          </button>
        </div>

        {activeApi === 'fal' ? (
          <div className="seedream-layout">
            <section className="seedream-panel" aria-label="生成设置面板">
            <div className="panel-card collapsible">
              <button 
                type="button"
                className="collapse-header"
                onClick={() => setShowApiKeyPanel(!showApiKeyPanel)}
              >
                <h2>🔑 Fal.ai API Key</h2>
                <span className="collapse-icon">{showApiKeyPanel ? '▼' : '▶'}</span>
              </button>
              {showApiKeyPanel && (
                <div className="collapse-content">
                  <p className="panel-tip">API Key 仅保存在本地浏览器，请放心使用</p>
                  <div className="field-group">
                    <label htmlFor="fal-api-key">FAL_KEY</label>
                    <input
                      id="fal-api-key"
                      type="text"
                      placeholder="输入 Fal.ai API Key"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                    />
                  </div>
                  <div className="panel-actions">
                    <button type="button" className="primary" onClick={handleSaveKey}>
                      🐾 保存到本地
                    </button>
                    <button type="button" className="ghost" onClick={handleClearKey}>
                      🧼 清除保存
                    </button>
                  </div>
                  {saveMessage && <p className="panel-message">{saveMessage}</p>}
                </div>
              )}
            </div>

            <div className="panel-card">
              <h2>🤖 模型选择</h2>
              <div className="field-group">
                <label htmlFor="model-select">选择模型</label>
                <select
                  id="model-select"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                >
                  <option value="v4">Seedream v4 (经典)</option>
                  <option value="v4.5">Seedream v4.5 (最新)</option>
                  <option value="new">Gemini 3 Pro (新版)</option>
                  <option value="z-image-turbo">Z-Image Turbo (6B 超快速)</option>
                </select>
              </div>
            </div>

            <div className="panel-card">
              <h2>📝 提示词</h2>
              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="seedream-prompt">Prompt</label>
                  <div className="field-actions">
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => handleGenerateRandomPrompt('fal')}
                      disabled={randomPromptLoading || optimizePromptLoading}
                      style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}
                    >
                      {randomPromptLoading ? '🎲 生成中...' : '🎲 随机提示词'}
                    </button>
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => handleOptimizePrompt('fal')}
                      disabled={!prompt.trim() || optimizePromptLoading || randomPromptLoading}
                      style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}
                    >
                      {optimizePromptLoading ? '✨ 优化中...' : '✨ 优化提示词'}
                    </button>
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => setPrompt('')}
                      disabled={!prompt}
                    >
                      清空
                    </button>
                  </div>
                </div>
                <textarea
                  id="seedream-prompt"
                  rows={4}
                  placeholder="例如：一只穿着宇航服的橘猫，在火星上骑自行车，数字艺术"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </div>
            </div>

            <div className="panel-card">
              <h2>🧪 生成模式</h2>
              <div className="mode-toggle" role="group" aria-label="Seedream 模式切换">
                <button
                  type="button"
                  className={`mode-button${mode === 'text' ? ' active' : ''}`}
                  onClick={() => handleModeChange('text')}
                >
                  文生图
                </button>
                <button
                  type="button"
                  className={`mode-button${mode === 'edit' ? ' active' : ''}`}
                  onClick={() => handleModeChange('edit')}
                >
                  图像编辑
                </button>
              </div>
              {mode === 'edit' && (
                <p className="panel-tip">需要上传或提供待编辑图像，生成结果保持橘猫主题风格</p>
              )}
            </div>

            {mode === 'edit' && (
              <div className="panel-card">
                <h2>🖼️ 输入图像</h2>
                <div className="input-tabs" role="tablist">
                  <button
                    type="button"
                    className={`input-tab${imageInputMethod === 'upload' ? ' active' : ''}`}
                    onClick={() => handleImageInputMethodChange('upload')}
                  >
                    本地上传
                  </button>
                  <button
                    type="button"
                    className={`input-tab${imageInputMethod === 'urls' ? ' active' : ''}`}
                    onClick={() => handleImageInputMethodChange('urls')}
                  >
                    粘贴 URL
                  </button>
                </div>

                {imageInputMethod === 'upload' ? (
                  <div className="file-upload">
                    <label className="file-label" htmlFor="seedream-upload">
                      <span>选择一张基础图像</span>
                      <input
                        id="seedream-upload"
                        ref={inputImageRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    {uploadedImage && (
                      <div className="upload-preview">
                        <img src={uploadedImagePreview} alt="待编辑的基础图像预览" />
                        <button type="button" className="remove-button" onClick={handleRemoveUploadedImage}>
                          移除图像
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="field-group">
                    <label htmlFor="seedream-url-input">图像 URLs（每行一条）</label>
                    <textarea
                      id="seedream-url-input"
                      rows={4}
                      placeholder="https://example.com/image.png"
                      value={imageUrlsText}
                      onChange={(event) => setImageUrlsText(event.target.value)}
                    />
                    <p className="panel-tip">确保链接可直接访问原图，建议使用 HTTPS 地址</p>
                  </div>
                )}

                {(modelType === 'v4' || modelType === 'v4.5') && (
                  <div className="field-group">
                    <label htmlFor="seedream-control-scale">编辑强度 (0 - 2)</label>
                    <input
                      id="seedream-control-scale"
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={controlScale}
                      onChange={(event) => setControlScale(event.target.value)}
                    />
                    <span className="range-value">当前强度：{controlScaleNumber.toFixed(2)}</span>
                  </div>
                )}
                {modelType === 'z-image-turbo' && (
                  <div className="field-group">
                    <label htmlFor="z-image-strength">图生图强度 (0 - 1)</label>
                    <input
                      id="z-image-strength"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={zImageStrength}
                      onChange={(event) => setZImageStrength(Number.parseFloat(event.target.value))}
                    />
                    <span className="range-value">当前强度：{zImageStrength.toFixed(2)}</span>
                    <p className="panel-tip" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>强度越高，生成图像与原图差异越大</p>
                  </div>
                )}
              </div>
            )}

            <div className="panel-card collapsible">
              <button 
                type="button"
                className="collapse-header"
                onClick={() => setShowParamsPanel(!showParamsPanel)}
              >
                <h2>⚙️ 参数设置</h2>
                <span className="collapse-icon">{showParamsPanel ? '▼' : '▶'}</span>
              </button>
              {showParamsPanel && (
                <div className="collapse-content">
                  <div className="field-grid">
                    {modelType === 'v4' || modelType === 'v4.5' ? (
                      <>
                        <div className="field-group">
                          <label htmlFor="seedream-size">图像尺寸</label>
                          <select
                            id="seedream-size"
                            value={sizePreset}
                            onChange={(event) => setSizePreset(event.target.value)}
                          >
                            <option value="square_hd">Square HD (1024x1024)</option>
                            <option value="square">Square (默认)</option>
                            <option value="portrait_4_3">Portrait 4:3</option>
                            <option value="portrait_16_9">Portrait 16:9</option>
                            <option value="landscape_4_3">Landscape 4:3</option>
                            <option value="landscape_16_9">Landscape 16:9</option>
                            <option value="auto">Auto</option>
                            <option value="auto_2K">Auto 2K</option>
                            <option value="auto_4K">Auto 4K</option>
                            <option value="custom">自定义尺寸</option>
                          </select>
                        </div>

                        {isCustomSize && (
                          <>
                            <div className="field-group">
                              <label htmlFor="seedream-width">宽度 (1024-4096)</label>
                              <input
                                id="seedream-width"
                                type="number"
                                min={1024}
                                max={4096}
                                value={customWidth}
                                onChange={(event) => setCustomWidth(event.target.value)}
                              />
                            </div>
                            <div className="field-group">
                              <label htmlFor="seedream-height">高度 (1024-4096)</label>
                              <input
                                id="seedream-height"
                                type="number"
                                min={1024}
                                max={4096}
                                value={customHeight}
                                onChange={(event) => setCustomHeight(event.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </>
                    ) : modelType === 'z-image-turbo' ? (
                      <>
                        <div className="field-group">
                          <label htmlFor="z-image-size">图像尺寸</label>
                          <select
                            id="z-image-size"
                            value={sizePreset}
                            onChange={(event) => setSizePreset(event.target.value)}
                          >
                            <option value="landscape_4_3">Landscape 4:3 (默认)</option>
                            <option value="landscape_16_9">Landscape 16:9</option>
                            <option value="portrait_4_3">Portrait 4:3</option>
                            <option value="portrait_16_9">Portrait 16:9</option>
                            <option value="square">Square</option>
                            <option value="square_hd">Square HD</option>
                            <option value="auto">Auto</option>
                          </select>
                        </div>
                        <div className="field-group">
                          <label htmlFor="z-image-steps">推理步数 (1-8)</label>
                          <input
                            id="z-image-steps"
                            type="number"
                            min={1}
                            max={8}
                            value={numInferenceSteps}
                            onChange={(e) => setNumInferenceSteps(Number.parseInt(e.target.value, 10) || 8)}
                          />
                          <p className="panel-tip" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>默认 8，值越高质量越好但速度较慢</p>
                        </div>
                        <div className="field-group">
                          <label htmlFor="z-image-format">输出格式</label>
                          <select
                            id="z-image-format"
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                          >
                            <option value="png">PNG</option>
                            <option value="jpeg">JPEG</option>
                            <option value="webp">WebP</option>
                          </select>
                        </div>
                        <div className="field-group">
                          <label htmlFor="z-image-acceleration">加速等级</label>
                          <select
                            id="z-image-acceleration"
                            value={acceleration}
                            onChange={(e) => setAcceleration(e.target.value)}
                          >
                            <option value="none">无加速 (默认)</option>
                            <option value="regular">常规加速</option>
                            <option value="high">高速加速</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="field-group">
                          <label htmlFor="new-aspect-ratio">纵横比</label>
                          <select
                            id="new-aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                          >
                            <option value="1:1">1:1</option>
                            <option value="16:9">16:9</option>
                            <option value="21:9">21:9</option>
                            <option value="3:2">3:2</option>
                            <option value="4:3">4:3</option>
                            <option value="5:4">5:4</option>
                            <option value="4:5">4:5</option>
                            <option value="3:4">3:4</option>
                            <option value="2:3">2:3</option>
                            <option value="9:16">9:16</option>
                          </select>
                        </div>
                        <div className="field-group">
                          <label htmlFor="new-resolution">分辨率</label>
                          <select
                            id="new-resolution"
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                          >
                            <option value="1K">1K</option>
                            <option value="2K">2K</option>
                            <option value="4K">4K</option>
                          </select>
                        </div>
                        <div className="field-group">
                          <label htmlFor="new-format">输出格式</label>
                          <select
                            id="new-format"
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                          >
                            <option value="png">PNG</option>
                            <option value="jpeg">JPEG</option>
                            <option value="webp">WebP</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="field-group">
                      <label htmlFor="seedream-num">生成数量</label>
                      <input
                        id="seedream-num"
                        type="number"
                        min={1}
                        max={modelType === 'z-image-turbo' ? 4 : undefined}
                        value={numImages}
                        onChange={(event) => setNumImages(Number.parseInt(event.target.value, 10) || 1)}
                      />
                      {modelType === 'z-image-turbo' && (
                        <p className="panel-tip" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>最多 4 张</p>
                      )}
                    </div>

                    {(modelType === 'v4' || modelType === 'v4.5' || modelType === 'z-image-turbo') && (
                      <div className="field-group seed-input">
                        <label htmlFor="seedream-seed">随机种子</label>
                        <div className="inline-field">
                          <input
                            id="seedream-seed"
                            type="number"
                            placeholder="留空则为随机"
                            value={seed}
                            onChange={(event) => setSeed(event.target.value)}
                          />
                          <button type="button" className="ghost" onClick={handleRandomSeed}>
                            🎲 随机
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="toggle-group">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={syncMode}
                    onChange={(event) => setSyncMode(event.target.checked)}
                  />
                  <span>同步模式 (Base64 输出)</span>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={safetyChecker}
                    onChange={(event) => setSafetyChecker(event.target.checked)}
                  />
                  <span>启用安全检查</span>
                </label>
                {modelType === 'z-image-turbo' && (
                  <label className="toggle-item">
                    <input
                      type="checkbox"
                      checked={enablePromptExpansion}
                      onChange={(event) => setEnablePromptExpansion(event.target.checked)}
                    />
                    <span>启用提示词扩展 (+0.0025 积分)</span>
                  </label>
                )}
              </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="generate-button"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span>生成中...</span>
                  <span className="seedream-loader" aria-hidden="true" />
                </>
              ) : mode === 'edit' ? (
                '✨ 编辑图像'
              ) : (
                '✨ 生成图像'
              )}
            </button>

            {error && <p className="error-banner" role="alert">{error}</p>}
          </section>

            <section 
              className={`seedream-output ${!loading && images.length === 0 ? 'mobile-hidden' : ''}`} 
              aria-label="生成结果区域"
            >
              <div className="output-card">
                <h2>🎨 生成结果</h2>

                {!loading && !error && images.length === 0 && (
                  <div className="output-placeholder">
                    <p>喵~ 还没有生成记录，输入提示词后点击“生成图像”试试吧</p>
                  </div>
                )}

                {loading && (
                  <div className="output-placeholder">
                    <p>正在调用 Seedream v4，小猫仔细绘画中...</p>
                  </div>
                )}

                {resultSeed && (
                  <div className="seed-info">
                    <span>生成种子：</span>
                    <strong>{resultSeed}</strong>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="image-grid">
                    {images.map((image, index) => (
                      <figure key={image.src} className="seedream-image-card">
                        <img src={image.src} alt={`Seedream 生成图像 ${index + 1}`} loading="lazy" />
                        <figcaption>
                          <button
                            type="button"
                            className="download-link"
                            onClick={() => handleImageDownload(image.src, image.downloadName)}
                          >
                            ⬇️ 下载第 {index + 1} 张
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : activeApi === 'qiniu' ? (
          <div className="seedream-layout qiniu-mode">
            <section className="seedream-panel" aria-label="七牛生成设置">
              <div className="panel-card">
                <h2>📝 提示词 & 模型</h2>
                <div className="field-group">
                  <label htmlFor="qiniu-key-choice">使用的 Key</label>
                  <select
                    id="qiniu-key-choice"
                    value={qiniuKeyChoice}
                    onChange={(event) => setQiniuKeyChoice(event.target.value)}
                  >
                    <option value="auto">自动切换（默认）</option>
                    <option value="primary">主 Key</option>
                    <option value="secondary">备用 Key</option>
                  </select>
                  <p className="panel-tip">当主 Key 被限流/未认证时可手动切换备用 Key。</p>
                </div>
                <div className="field-group">
                  <div className="field-label-row">
                    <label htmlFor="qiniu-prompt">Prompt</label>
                    <div className="field-actions">
                      <button
                        type="button"
                        className="clear-button"
                        onClick={() => handleGenerateRandomPrompt('qiniu')}
                        disabled={randomPromptLoading || optimizePromptLoading}
                        style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}
                      >
                        {randomPromptLoading ? '🎲 生成中...' : '🎲 随机提示词'}
                      </button>
                      <button
                        type="button"
                        className="clear-button"
                        onClick={() => handleOptimizePrompt('qiniu')}
                        disabled={!qiniuPrompt.trim() || optimizePromptLoading || randomPromptLoading}
                        style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}
                      >
                        {optimizePromptLoading ? '✨ 优化中...' : '✨ 优化提示词'}
                      </button>
                      <button
                        type="button"
                        className="clear-button"
                        onClick={() => setQiniuPrompt('')}
                        disabled={!qiniuPrompt}
                      >
                        清空
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="qiniu-prompt"
                    rows={4}
                    placeholder="一只可爱的橘猫坐在窗台上看夕阳，专业摄影，金色光晕"
                    value={qiniuPrompt}
                    onChange={(event) => setQiniuPrompt(event.target.value)}
                  />
                </div>
              </div>

              <div className="panel-card">
                <h2>🧪 生成模式</h2>
                <div className="mode-toggle" role="group" aria-label="七牛模式切换">
                  <button
                    type="button"
                    className={`mode-button${qiniuMode === 'text' ? ' active' : ''}`}
                    onClick={() => handleQiniuModeChange('text')}
                  >
                    文生图
                  </button>
                  <button
                    type="button"
                    className={`mode-button${qiniuMode === 'edit' ? ' active' : ''}`}
                    onClick={() => handleQiniuModeChange('edit')}
                  >
                    图像编辑
                  </button>
                </div>
                <p className="panel-tip">文生图直接生成新画面；图像编辑会结合下方输入图像与遮罩。</p>
              </div>

              {/* 七牛图像编辑模式需要额外的输入素材与遮罩 */}
              {qiniuMode === 'edit' && (
                <>
                  <div className="panel-card">
                    <h2>🖼️ 待编辑图像</h2>
                    <div className="file-upload">
                      <label className="file-label" htmlFor="qiniu-image-upload">
                        <span>上传一张或多张基础图像</span>
                        <input
                          id="qiniu-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleQiniuImageUpload}
                        />
                      </label>
                      {qiniuImageUploads.length > 0 && (
                        <ul className="upload-list">
                          {qiniuImageUploads.map((item, index) => (
                            <li key={`${item.name}-${index}`} className="upload-item">
                              <div>
                                <strong>{item.name}</strong>
                                <span className="upload-size">{Math.round(item.size / 1024)} KB</span>
                              </div>
                              <button type="button" className="ghost" onClick={() => handleRemoveQiniuUpload(index)}>
                                移除
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                </>
              )}

              {/* 高级参数折叠面板，集中放置所有可选字段 */}
              <div className="panel-card collapsible">
                <button 
                  type="button"
                  className="collapse-header"
                  onClick={() => setShowQiniuParamsPanel(!showQiniuParamsPanel)}
                >
                  <h2>⚙️ 参数设置</h2>
                  <span className="collapse-icon">{showQiniuParamsPanel ? '▼' : '▶'}</span>
                </button>
                {showQiniuParamsPanel && (
                  <div className="collapse-content">
                    <div className="field-grid">
                      <div className="field-group">
                        <label htmlFor="qiniu-n">生成数量 (n)</label>
                        <input
                          id="qiniu-n"
                          type="number"
                          min={1}
                          max={10}
                          value={qiniuCount}
                          onChange={(event) => setQiniuCount(Number.parseInt(event.target.value, 10) || 1)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-aspect">画面比例 (aspect_ratio)</label>
                        <select
                          id="qiniu-aspect"
                          value={qiniuAspectRatio}
                          onChange={(event) => setQiniuAspectRatio(event.target.value)}
                        >
                          <option value="">默认（不传）</option>
                          <option value="1:1">1:1 正方形</option>
                          <option value="1:3">1:3 纵向</option>
                          <option value="2:3">2:3 纵向</option>
                          <option value="3:2">3:2 横向</option>
                          <option value="3:4">3:4 纵向</option>
                          <option value="4:3">4:3 横向</option>
                          <option value="4:5">4:5 纵向</option>
                          <option value="5:4">5:4 横向</option>
                          <option value="9:16">9:16 竖屏</option>
                          <option value="16:9">16:9 横屏</option>
                          <option value="21:9">21:9 超宽屏</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-image-size">图像分辨率 (image_size)</label>
                        <select
                          id="qiniu-image-size"
                          value={qiniuImageSize}
                          onChange={(event) => setQiniuImageSize(event.target.value)}
                        >
                          <option value="2K">2K (默认)</option>
                          <option value="4K">4K</option>
                          <option value="1K">1K</option>
                        </select>
                        <p className="panel-tip">仅 Gemini 3.0 Pro Image Preview 支持 image_config，默认分辨率 2K。</p>
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-quality">画质 (quality)</label>
                        <select
                          id="qiniu-quality"
                          value={qiniuQuality}
                          onChange={(event) => setQiniuQuality(event.target.value)}
                        >
                          <option value="">默认 (不传)</option>
                          <option value="standard">Standard</option>
                          <option value="hd">HD</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-style">风格 (style)</label>
                        <select
                          id="qiniu-style"
                          value={qiniuStyle}
                          onChange={(event) => setQiniuStyle(event.target.value)}
                        >
                          <option value="vivid">Vivid</option>
                          <option value="natural">Natural</option>
                        </select>
                      </div>
                    </div>

                    <div className="field-grid" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div className="field-group">
                        <label htmlFor="qiniu-temperature">随机性 (temp)</label>
                        <input
                          id="qiniu-temperature"
                          type="number"
                          min={0}
                          max={2}
                          step={0.05}
                          value={qiniuTemperature}
                          onChange={(event) => setQiniuTemperature(event.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-top-p">核采样 (top_p)</label>
                        <input
                          id="qiniu-top-p"
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={qiniuTopP}
                          onChange={(event) => setQiniuTopP(event.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-top-k">Top-K</label>
                        <input
                          id="qiniu-top-k"
                          type="number"
                          min={1}
                          value={qiniuTopK}
                          onChange={(event) => setQiniuTopK(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 高级参数折叠面板，集中管理所有可选字段 */}
              <div className="panel-card collapsible">
                <button
                  type="button"
                  className="collapse-header"
                  onClick={() => setShowQiniuAdvancedPanel(!showQiniuAdvancedPanel)}
                >
                  <h2>🧰 高级参数</h2>
                  <span className="collapse-icon">{showQiniuAdvancedPanel ? '▼' : '▶'}</span>
                </button>
                {showQiniuAdvancedPanel && (
                  <div className="collapse-content">
                    <div className="field-group">
                      <div className="field-label-row">
                        <label htmlFor="qiniu-negative">负面提示词</label>
                        <button
                          type="button"
                          className="clear-button"
                          onClick={() => setQiniuNegativePrompt('')}
                          disabled={!qiniuNegativePrompt}
                        >
                          清空
                        </button>
                      </div>
                      <textarea
                        id="qiniu-negative"
                        rows={3}
                        placeholder="例如：低清晰度、奇怪的手"
                        value={qiniuNegativePrompt}
                        onChange={(event) => setQiniuNegativePrompt(event.target.value)}
                      />
                    </div>

                    <div className="field-grid">
                      <div className="field-group">
                        <label htmlFor="qiniu-reference-image">参考图片 URL</label>
                        <input
                          id="qiniu-reference-image"
                          type="text"
                          placeholder="https://example.com/style.png"
                          value={qiniuImageUrl}
                          onChange={(event) => setQiniuImageUrl(event.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-reference-data">image_reference JSON</label>
                        <textarea
                          id="qiniu-reference-data"
                          rows={2}
                          placeholder="可选：粘贴官方 image_reference JSON 字符串"
                          value={qiniuImageReference}
                          onChange={(event) => setQiniuImageReference(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field-grid">
                      <div className="field-group">
                        <label htmlFor="qiniu-image-fidelity">image_fidelity (0-1)</label>
                        <input
                          id="qiniu-image-fidelity"
                          type="number"
                          step={0.05}
                          min={0}
                          max={1}
                          value={qiniuImageFidelity}
                          onChange={(event) => setQiniuImageFidelity(event.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-human-fidelity">human_fidelity (0-1)</label>
                        <input
                          id="qiniu-human-fidelity"
                          type="number"
                          step={0.05}
                          min={0}
                          max={1}
                          value={qiniuHumanFidelity}
                          onChange={(event) => setQiniuHumanFidelity(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field-grid">
                      <div className="field-group">
                        <label htmlFor="qiniu-background">背景设置</label>
                        <input
                          id="qiniu-background"
                          type="text"
                          placeholder="auto / transparent / #fff"
                          value={qiniuBackground}
                          onChange={(event) => setQiniuBackground(event.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-input-fidelity">输入忠实度</label>
                        <select
                          id="qiniu-input-fidelity"
                          value={qiniuInputFidelity}
                          onChange={(event) => setQiniuInputFidelity(event.target.value)}
                        >
                          <option value="high">high</option>
                          <option value="low">low</option>
                          <option value="auto">auto</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-output-format">输出格式</label>
                        <select
                          id="qiniu-output-format"
                          value={qiniuOutputFormatSetting}
                          onChange={(event) => setQiniuOutputFormatSetting(event.target.value)}
                        >
                          <option value="png">png</option>
                          <option value="jpeg">jpeg</option>
                          <option value="webp">webp</option>
                        </select>
                      </div>
                    </div>

                    <div className="field-grid">
                      <div className="field-group">
                        <label htmlFor="qiniu-output-compression">压缩质量 (0-100)</label>
                        <input
                          id="qiniu-output-compression"
                          type="number"
                          min={0}
                          max={100}
                          value={qiniuOutputCompression}
                          onChange={(event) => setQiniuOutputCompression(event.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label htmlFor="qiniu-response-format">响应格式</label>
                        <select
                          id="qiniu-response-format"
                          value={qiniuResponseFormat}
                          onChange={(event) => setQiniuResponseFormat(event.target.value)}
                        >
                          <option value="b64_json">b64_json</option>
                          <option value="url">url</option>
                        </select>
                      </div>
                      <div className="field-group checkbox-field">
                        <label htmlFor="qiniu-stream">开启流式</label>
                        <div className="toggle-item">
                          <input
                            id="qiniu-stream"
                            type="checkbox"
                            checked={qiniuStream}
                            onChange={(event) => setQiniuStream(event.target.checked)}
                          />
                          <span>stream</span>
                        </div>
                      </div>
                    </div>

                    <div className="field-group">
                      <label htmlFor="qiniu-mask-text">遮罩 Base64 / URL</label>
                      <textarea
                        id="qiniu-mask-text"
                        rows={3}
                        placeholder="可直接粘贴 data:image/png;base64,... 或在线遮罩 URL"
                        value={qiniuMaskText}
                        onChange={(event) => setQiniuMaskText(event.target.value)}
                      />
                      <p className="panel-tip">仅在图像编辑模式下生效，透明区域代表可修改范围。</p>
                    </div>
                    <div className="file-upload">
                      <label className="file-label" htmlFor="qiniu-mask-upload">
                        <span>上传遮罩 PNG（透明区域代表可编辑）</span>
                        <input
                          id="qiniu-mask-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleQiniuMaskUpload}
                        />
                      </label>
                      {(qiniuMaskFileName || qiniuMaskUpload) && (
                        <div className="mask-preview">
                          <p>当前遮罩：{qiniuMaskFileName || '自定义 Mask 数据'}</p>
                          <button type="button" className="ghost" onClick={handleClearMask}>
                            清空遮罩
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="generate-button"
                onClick={handleQiniuGenerate}
                disabled={qiniuLoading}
              >
                {qiniuLoading ? (
                  <>
                    <span>七牛生成中...</span>
                    <span className="seedream-loader" aria-hidden="true" />
                  </>
                ) : (
                  '✨ 调用七牛生成'
                )}
              </button>

              {qiniuLoading && (
                <button
                  type="button"
                  className="ghost"
                  onClick={cancelQiniuRequest}
                  style={{ marginTop: '0.5rem' }}
                >
                  ⏹ 停止等待
                </button>
              )}

              {qiniuError && <p className="error-banner" role="alert">{qiniuError}</p>}
            </section>

            <section
              className={`seedream-output ${!qiniuLoading && qiniuImages.length === 0 ? 'mobile-hidden' : ''}`}
              aria-label="七牛生成结果"
            >
              <div className="output-card">
                <h2>🎨 七牛生成结果</h2>

                {!qiniuLoading && !qiniuError && qiniuImages.length === 0 && (
                  <div className="output-placeholder">
                    <p>切换到七牛后，填好提示词再点击“调用七牛生成”即可查看结果~</p>
                  </div>
                )}

                {qiniuLoading && (
                  <div className="output-placeholder">
                    <p>七牛小喵绘制中，请稍等...</p>
                  </div>
                )}

                {qiniuUsage && (
                  <div className="seedream-usage">
                    <span>输入 Tokens：{qiniuUsage?.input_tokens ?? '--'}</span>
                    <span>输出 Tokens：{qiniuUsage?.output_tokens ?? '--'}</span>
                    <span>总计：{qiniuUsage?.total_tokens ?? '--'}</span>
                  </div>
                )}

                {qiniuImages.length > 0 && (
                  <div className="image-grid">
                    {qiniuImages.map((image, index) => (
                      <figure key={image.src} className="seedream-image-card">
                        <img src={image.src} alt={`七牛文生图 ${index + 1}`} loading="lazy" />
                        <figcaption>
                          <a href={image.src} download={image.downloadName} target="_blank" rel="noreferrer">
                            ⬇️ 下载第 {index + 1} 张
                          </a>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* 更多玩法面板 */
          <div className="seedream-layout playground-mode">
            {playgroundMode === 'list' ? (
              <div className="playground-list-container">
                <div className="playground-grid">
                  <div 
                    className="playground-card" 
                    onClick={() => setPlaygroundMode('random-coser')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="card-icon">🎀</div>
                    <div className="card-content">
                      <h3>随机 Coser 生成</h3>
                      <p>双引擎驱动，一键生成高质量 Coser 写真，支持自定义特征。</p>
                    </div>
                    <div className="card-arrow">→</div>
                  </div>
                  <div className="playground-card disabled">
                    <div className="card-icon">🚧</div>
                    <div className="card-content">
                      <h3>更多玩法开发中</h3>
                      <p>敬请期待...</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="playground-content-wrapper">
                <div className="playground-header">
                  <button 
                    className="back-button" 
                    onClick={() => setPlaygroundMode('list')}
                  >
                    ← 返回玩法列表
                  </button>
                  <h2>随机 Coser 生成</h2>
                </div>
                <div className="seedream-layout coser-mode">
            <section className="seedream-panel coser-panel" aria-label="随机 Coser 生成设置">
              {/* 用户自定义输入 */}
              <div className="panel-card">
                <h2>💭 自定义需求（可选）</h2>
                <div className="field-group">
                  <div className="field-label-row">
                    <label htmlFor="coser-user-input">输入你想要的元素</label>
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => setCoserUserInput('')}
                      disabled={!coserUserInput}
                    >
                      清空
                    </button>
                  </div>
                  <textarea
                    id="coser-user-input"
                    rows={3}
                    placeholder="例如：穿和服、在樱花树下、甜美笑容、蓝色长发..."
                    value={coserUserInput}
                    onChange={(event) => setCoserUserInput(event.target.value)}
                  />
                  <p className="panel-tip">留空则完全随机，填写后 AI 会在你的需求基础上生成提示词</p>
                </div>
              </div>

              {/* Fal API Key 提示 */}
              {!apiKey.trim() && (
                <div className="panel-card warning-card">
                  <p>⚠️ 请先切换到「Fal.ai Seedream」面板填写 API Key，才能使用双引擎生成功能</p>
                </div>
              )}

              <button
                type="button"
                className="generate-button coser-generate-button"
                onClick={handleCoserGenerate}
                disabled={coserLoading || coserPromptLoading}
              >
                {coserLoading || coserPromptLoading ? (
                  <>
                    <span>{coserStep || '生成中...'}</span>
                    <span className="seedream-loader" aria-hidden="true" />
                  </>
                ) : (
                  '🎀 一键生成随机 Coser'
                )}
              </button>

              {coserError && <p className="error-banner" role="alert">{coserError}</p>}

              {/* 生成的提示词展示 */}
              {coserPrompt && (
                <div className="panel-card coser-prompt-card">
                  <h2>📝 生成的提示词</h2>
                  <div className="coser-prompt-content">
                    <p>{coserPrompt}</p>
                  </div>
                </div>
              )}
            </section>

            <section
              className={`seedream-output coser-output ${!coserLoading && !coserPromptLoading && !coserFalImage && !coserQiniuImage && !coserFalLoading && !coserQiniuLoading ? 'mobile-hidden' : ''}`}
              aria-label="随机 Coser 生成结果"
            >
              <div className="output-card">
                <h2>🎨 双引擎生成结果</h2>

                {!coserLoading && !coserPromptLoading && !coserFalImage && !coserQiniuImage && !coserFalLoading && !coserQiniuLoading && (
                  <div className="output-placeholder">
                    <p>点击「一键生成随机 Coser」开始体验双引擎对比生成~</p>
                  </div>
                )}

                {(coserFalImage || coserQiniuImage || coserFalLoading || coserQiniuLoading) && (
                  <div className="coser-image-compare">
                    {/* Fal 生成结果 */}
                    <div className="coser-image-column">
                      <h3 className="engine-label fal-label">🧠 Fal Seedream v4</h3>
                      {coserFalImage ? (
                        <figure className="seedream-image-card">
                          <img src={coserFalImage.src} alt="Fal Seedream 生成的 Coser 写真" loading="lazy" />
                          <figcaption>
                            <button
                              type="button"
                              className="download-link"
                              onClick={() => handleImageDownload(coserFalImage.src, coserFalImage.downloadName)}
                            >
                              ⬇️ 下载 Fal 图片
                            </button>
                          </figcaption>
                        </figure>
                      ) : (
                        <div className="coser-image-placeholder">
                          {coserFalLoading ? (
                            <>
                              <span className="seedream-loader" aria-hidden="true" />
                              <p>Fal 生成中...</p>
                            </>
                          ) : (
                            <p>生成失败</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 七牛生成结果 */}
                    <div className="coser-image-column">
                      <h3 className="engine-label qiniu-label">🐧 七牛 Gemini</h3>
                      {coserQiniuImage ? (
                        <figure className="seedream-image-card">
                          <img src={coserQiniuImage.src} alt="七牛 Gemini 生成的 Coser 写真" loading="lazy" />
                          <figcaption>
                            <button
                              type="button"
                              className="download-link"
                              onClick={() => handleImageDownload(coserQiniuImage.src, coserQiniuImage.downloadName)}
                            >
                              ⬇️ 下载七牛图片
                            </button>
                          </figcaption>
                        </figure>
                      ) : (
                        <div className="coser-image-placeholder">
                          {coserQiniuLoading ? (
                            <>
                              <span className="seedream-loader" aria-hidden="true" />
                              <p>七牛生成中...</p>
                            </>
                          ) : (
                            <p>生成失败</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SeedreamStudio
