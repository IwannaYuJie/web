import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fal } from '@fal-ai/client'
import './SeedreamStudio.css'

/**
 * SeedreamStudio 页面组件
 * 提供 Fal.ai Seedream v4 文生图体验，支持参数定制与结果预览
 */
function SeedreamStudio() {
  const storageKey = 'seedream-fal-key'
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [sizePreset, setSizePreset] = useState('auto_4K')
  const [customWidth, setCustomWidth] = useState('1024')
  const [customHeight, setCustomHeight] = useState('1024')
  const [enhanceMode, setEnhanceMode] = useState('standard')
  const [numImages, setNumImages] = useState(1)
  const [maxImages, setMaxImages] = useState(1)
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
  
  // 新增模型选择与参数状态
  const [modelType, setModelType] = useState('v4') // 'v4' | 'new'
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1K')
  const [outputFormat, setOutputFormat] = useState('png')

  const inputImageRef = useRef(null)

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

      if (modelType === 'v4') {
        inputPayload = {
          prompt: prompt.trim(),
          image_size: imageSizeInput,
          enhance_prompt_mode: enhanceMode,
          num_images: Number.parseInt(String(numImages), 10) || 1,
          max_images: Number.parseInt(String(maxImages), 10) || 1,
          sync_mode: syncMode,
          enable_safety_checker: safetyChecker
        }

        if (seed.trim()) {
          const parsedSeed = Number.parseInt(seed.trim(), 10)
          if (!Number.isNaN(parsedSeed)) {
            inputPayload.seed = parsedSeed
          }
        }

        modelId = 'fal-ai/bytedance/seedream/v4/text-to-image'

        if (mode === 'edit') {
          modelId = 'fal-ai/bytedance/seedream/v4/edit'
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

      if (!result) {
        setError('😿 没有收到返回结果，请稍后重试')
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
        return
      }

      setResultSeed(resultSeedValue ? String(resultSeedValue) : '')
      const normalizedImages = normalizeImages(imageList)
      console.log('转换后的图片列表:', normalizedImages)

      if (normalizedImages.length === 0) {
        setError('😿 图片格式转换失败，请检查控制台日志')
        console.error('所有图片转换后为空，原始数据:', imageList)
        return
      }

      setImages(normalizedImages)
    } catch (generationError) {
      console.error('调用 Fal Seedream 失败:', generationError)
      setError(generationError?.message || '😿 发生未知错误，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const isCustomSize = sizePreset === 'custom'

  return (
    <div className="seedream-page">
      <div className="container">
        <header className="seedream-header">
          <h1>🌅 Seedream v4 AI 实验室</h1>
          <p>喵~ 在这里体验 Fal.ai Seedream v4 文生图魔法，支持高级参数调优与结果下载</p>
        </header>

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
                  <option value="new">Gemini 3 Pro (新版)</option>
                </select>
              </div>
            </div>

            <div className="panel-card">
              <h2>📝 提示词</h2>
              <div className="field-group">
                <label htmlFor="seedream-prompt">Prompt</label>
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

                {modelType === 'v4' && (
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
                    {modelType === 'v4' ? (
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

                        <div className="field-group">
                          <label htmlFor="seedream-enhance">提示增强</label>
                          <select
                            id="seedream-enhance"
                            value={enhanceMode}
                            onChange={(event) => setEnhanceMode(event.target.value)}
                          >
                            <option value="standard">Standard</option>
                            <option value="fast">Fast</option>
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
                        value={numImages}
                        onChange={(event) => setNumImages(Number.parseInt(event.target.value, 10) || 1)}
                      />
                    </div>

                    {modelType === 'v4' && (
                      <>
                        <div className="field-group">
                          <label htmlFor="seedream-max">每批最大图像</label>
                          <input
                            id="seedream-max"
                            type="number"
                            min={1}
                            value={maxImages}
                            onChange={(event) => setMaxImages(Number.parseInt(event.target.value, 10) || 1)}
                          />
                        </div>

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
                      </>
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
      </div>
    </div>
  )
}

export default SeedreamStudio
