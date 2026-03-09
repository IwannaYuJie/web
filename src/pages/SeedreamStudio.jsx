import { useEffect, useMemo, useRef, useState } from 'react'
import { fal } from '@fal-ai/client'
import { useApiKey, useFalGenerator, usePromptGenerator, useQiniuGenerator, useImageUpload } from '../hooks'
import { callQiniuTextToImage, fileToDataUrl, generateRandomSeed, normalizeImages, sendEmailNotification } from '../utils'
import { ApiKeyPanel, ApiSwitchTabs, CoserPlayground, ImageResults, ModelSelector } from '../components/seedream'
import './SeedreamStudio.css'

/**
 * SeedreamStudio 页面组件
 * 提供 Fal.ai Seedream v4 文生图体验，支持参数定制与结果预览
 * 新增随机 Coser 写真一键生成功能
 */
function SeedreamStudio() {
  const storageKey = 'seedream-fal-key'
  const { apiKey, setApiKey, saveMessage, saveKey: handleSaveKey, clearKey: handleClearKey } = useApiKey(storageKey)
  const { generateRandomPrompt, optimizePrompt, randomLoading: randomPromptLoading, optimizeLoading: optimizePromptLoading } = usePromptGenerator()
  const { quickGenerate } = useFalGenerator(apiKey)
  const {
    loading: qiniuLoading,
    error: qiniuError,
    setError: setQiniuError,
    images: qiniuImages,
    setImages: setQiniuImages,
    usage: qiniuUsage,
    cancelRequest: cancelQiniuRequest,
    generateTextToImage,
    generateImageToImage,
  } = useQiniuGenerator()
  const {
    uploadedImage,
    uploadedImagePreview,
    inputRef: inputImageRef,
    handleUpload: handleFalImageUpload,
    removeUploadedImage: removeFalUploadedImage,
  } = useImageUpload(false)
  const {
    uploadedImages: qiniuImageUploads,
    handleUpload: handleQiniuImagesUpload,
    removeUploadedImageAt: removeQiniuUploadAt,
  } = useImageUpload(true)

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
  const [mode, setMode] = useState('text')
  const [imageInputMethod, setImageInputMethod] = useState('upload')
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
  const [qiniuModel, _setQiniuModel] = useState('gemini-3.0-pro-image-preview')
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
  const [qiniuMode, setQiniuMode] = useState('text')
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
  const handleGenerateRandomPrompt = async (target) => {
    try {
      if (target === 'fal') {
        setError('')
        setPrompt(await generateRandomPrompt(prompt))
      } else {
        setQiniuError('')
        setQiniuPrompt(await generateRandomPrompt(qiniuPrompt))
      }
    } catch (err) {
      const errorMsg = err?.message || '😿 随机提示词生成失败，请稍后重试'
      if (target === 'fal') {setError(errorMsg)}
      else {setQiniuError(errorMsg)}
    }
  }

  const handleOptimizePrompt = async (target) => {
    try {
      if (target === 'fal') {
        setError('')
        setPrompt(await optimizePrompt(prompt))
      } else {
        setQiniuError('')
        setQiniuPrompt(await optimizePrompt(qiniuPrompt))
      }
    } catch (err) {
      const errorMsg = err?.message || '😿 提示词优化失败，请稍后重试'
      if (target === 'fal') {setError(errorMsg)}
      else {setQiniuError(errorMsg)}
    }
  }

  // 当切换模型时，重置和适配参数
  const prevModelTypeRef = useRef(modelType)
  useEffect(() => {
    // 只在模型真正切换时才重置参数，避免初始化时触发
    if (prevModelTypeRef.current !== modelType) {
      if (modelType === 'z-image-turbo') {
        // Z-Image Turbo 默认参数
        setSizePreset('square')
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

  const handleRandomSeed = () => {
    setSeed(generateRandomSeed())
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
      removeFalUploadedImage()
      setImageUrlsText('')
      setImageInputMethod('upload')
    }
  }

  const handleImageInputMethodChange = (method) => {
    setImageInputMethod(method)
    setImageUrlsText('')
    if (method === 'urls') {
      removeFalUploadedImage()
    }
  }

  const handleQiniuModeChange = (nextMode) => {
    if (nextMode === qiniuMode) {
      return
    }
    cancelQiniuRequest()
    setQiniuMode(nextMode)
    setQiniuError('')
    setQiniuImages([])
  }

  const handleQiniuImageUpload = async (event) => {
    try {
      await handleQiniuImagesUpload(event)
    } catch (uploadError) {
      setQiniuError(uploadError?.message || '😿 上传图像转换失败，请重试')
    }
  }

  const handleRemoveQiniuUpload = (indexToRemove) => {
    removeQiniuUploadAt(indexToRemove)
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

    if (qiniuQuality) {payload.quality = qiniuQuality}
    if (qiniuStyle) {payload.style = qiniuStyle}

    const temperatureValue = Number.parseFloat(qiniuTemperature)
    if (!Number.isNaN(temperatureValue)) {payload.temperature = temperatureValue}

    const topPValue = Number.parseFloat(qiniuTopP)
    if (!Number.isNaN(topPValue)) {payload.top_p = topPValue}

    const topKValue = Number.parseInt(qiniuTopK, 10)
    if (!Number.isNaN(topKValue)) {payload.top_k = topKValue}

    const negative = qiniuNegativePrompt.trim()
    if (negative) {payload.negative_prompt = negative}

    const imageUrl = qiniuImageUrl.trim()
    if (imageUrl) {payload.image = imageUrl}

    const reference = qiniuImageReference.trim()
    if (reference) {
      try { payload.image_reference = JSON.parse(reference) }
      catch { payload.image_reference = reference }
    }

    const fidelityValue = Number.parseFloat(qiniuImageFidelity)
    if (!Number.isNaN(fidelityValue)) {payload.image_fidelity = fidelityValue}

    const humanValue = Number.parseFloat(qiniuHumanFidelity)
    if (!Number.isNaN(humanValue)) {payload.human_fidelity = humanValue}

    await generateTextToImage(payload, qiniuKeyChoice)
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
    if (maskCandidate) {payload.mask = maskCandidate}

    const imageConfig = buildQiniuImageConfig()
    if (imageConfig) {payload.image_config = imageConfig}
    if (qiniuQuality) {payload.quality = qiniuQuality}
    if (qiniuStyle) {payload.style = qiniuStyle}
    if (qiniuBackground) {payload.background = qiniuBackground}
    if (qiniuInputFidelity) {payload.input_fidelity = qiniuInputFidelity}
    if (qiniuOutputFormatSetting) {payload.output_format = qiniuOutputFormatSetting}

    const compressionValue = Number.parseInt(qiniuOutputCompression, 10)
    if (!Number.isNaN(compressionValue)) {payload.output_compression = compressionValue}
    if (qiniuResponseFormat) {payload.response_format = qiniuResponseFormat}
    if (qiniuStream) {payload.stream = true}

    const topPValue = Number.parseFloat(qiniuTopP)
    if (!Number.isNaN(topPValue)) {payload.top_p = topPValue}
    const topKValue = Number.parseInt(qiniuTopK, 10)
    if (!Number.isNaN(topKValue)) {payload.top_k = topKValue}
    const tempValue = Number.parseFloat(qiniuTemperature)
    if (!Number.isNaN(tempValue)) {payload.temperature = tempValue}

    const negative = qiniuNegativePrompt.trim()
    if (negative) {payload.negative_prompt = negative}

    const reference = qiniuImageReference.trim()
    if (reference) {
      try { payload.image_reference = JSON.parse(reference) }
      catch { payload.image_reference = reference }
    }

    const imageUrl = qiniuImageUrl.trim()
    if (imageUrl) {payload.image_url = imageUrl}

    const fidelityValue = Number.parseFloat(qiniuImageFidelity)
    if (!Number.isNaN(fidelityValue)) {payload.image_fidelity = fidelityValue}
    const humanValue = Number.parseFloat(qiniuHumanFidelity)
    if (!Number.isNaN(humanValue)) {payload.human_fidelity = humanValue}

    await generateImageToImage(payload, qiniuKeyChoice)
  }

  const handleQiniuGenerate = () => {
    if (qiniuMode === 'edit') {
      return handleQiniuEditGenerate()
    }
    return handleQiniuTextGenerate()
  }

  const handleCoserGenerate = async () => {
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
      setCoserPromptLoading(true)
      const generatedPrompt = await generateRandomPrompt(coserUserInput.trim())
      setCoserPrompt(generatedPrompt)
      setCoserPromptLoading(false)
      setCoserStep('提示词已生成，正在调用双引擎生图...')

      quickGenerate(generatedPrompt, 'auto_4K')
        .then((result) => {
          setCoserFalImage({ ...result, downloadName: 'coser_fal.png' })
          setCoserFalLoading(false)
        })
        .catch((generationError) => {
          console.error('Fal 生图失败:', generationError)
          setCoserFalLoading(false)
        })

      callQiniuTextToImage({
        model: 'gemini-3.0-pro-image-preview',
        prompt: generatedPrompt,
        n: 1,
        style: 'vivid',
        temperature: 0.8,
        image_config: buildQiniuImageConfig() || { image_size: '2K' }
      }, qiniuKeyChoice)
        .then((data) => {
          const firstImage = normalizeImages(data?.data)[0]
          if (!firstImage) {
            throw new Error('七牛未返回图像')
          }
          setCoserQiniuImage({ ...firstImage, downloadName: 'coser_qiniu.png' })
          setCoserQiniuLoading(false)
        })
        .catch((generationError) => {
          console.error('七牛生图失败:', generationError)
          setCoserQiniuLoading(false)
        })

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

  const isCustomSize = sizePreset === 'custom'

  return (
    <div className="seedream-page">
      <div className="container">
        <header className="seedream-header">
          <h1>🌅 Seedream AI 实验室</h1>
          <p>喵~ 自由切换 Fal.ai Seedream v4 与七牛 Gemini-3.0-Pro Image Preview，玩转橘猫灵感 ✨</p>
        </header>

        <ApiSwitchTabs activeApi={activeApi} onSwitch={handleApiSwitch} />

        {activeApi === 'fal' ? (
          <div className="seedream-layout">
            <section className="seedream-panel" aria-label="生成设置面板">
            <ApiKeyPanel
              apiKey={apiKey}
              setApiKey={setApiKey}
              saveMessage={saveMessage}
              onSave={handleSaveKey}
              onClear={handleClearKey}
              isOpen={showApiKeyPanel}
              onToggle={() => setShowApiKeyPanel(!showApiKeyPanel)}
            />

            <ModelSelector modelType={modelType} setModelType={setModelType} />

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
                        onChange={handleFalImageUpload}
                      />
                    </label>
                    {uploadedImage && (
                      <div className="upload-preview">
                        <img src={uploadedImagePreview} alt="待编辑的基础图像预览" />
                        <button type="button" className="remove-button" onClick={removeFalUploadedImage}>
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
                            <option value="square">Square (默认)</option>
                            <option value="square_hd">Square HD</option>
                            <option value="landscape_4_3">Landscape 4:3</option>
                            <option value="landscape_16_9">Landscape 16:9</option>
                            <option value="portrait_4_3">Portrait 4:3</option>
                            <option value="portrait_16_9">Portrait 16:9</option>
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
              <ImageResults
                images={images}
                loading={loading}
                error={error}
                resultSeed={resultSeed}
                emptyText="喵~ 还没有生成记录，输入提示词后点击“生成图像”试试吧"
              />
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
                <CoserPlayground
                  userInput={coserUserInput}
                  setUserInput={setCoserUserInput}
                  apiKey={apiKey}
                  loading={coserLoading}
                  promptLoading={coserPromptLoading}
                  falLoading={coserFalLoading}
                  qiniuLoading={coserQiniuLoading}
                  error={coserError}
                  step={coserStep}
                  prompt={coserPrompt}
                  falImage={coserFalImage}
                  qiniuImage={coserQiniuImage}
                  onGenerate={handleCoserGenerate}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SeedreamStudio
