import React, { useEffect, useMemo, useState } from 'react'
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
  const [sizePreset, setSizePreset] = useState('square_hd')
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

  /**
   * 将 Fal 返回的图片对象转换为组件可消费的统一格式
   */
  const normalizeImages = (imageList = []) => {
    return imageList.map((item, index) => {
      if (item?.url) {
        return {
          src: item.url,
          downloadName: item.file_name || `seedream_${index + 1}.png`
        }
      }

      const base64 = item?.base64 || item?.b64_json || item?.content || ''
      if (base64) {
        return {
          src: `data:image/png;base64,${base64}`,
          downloadName: item?.file_name || `seedream_${index + 1}.png`
        }
      }

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

    setError('')
    setLoading(true)
    setImages([])
    setResultSeed('')

    try {
      fal.config({ credentials: apiKey.trim() })

      const inputPayload = {
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

      console.log('Seedream 输入参数:', inputPayload)

      const result = await fal.subscribe('fal-ai/bytedance/seedream/v4/text-to-image', {
        input: inputPayload,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('生成中:', update.logs)
          }
        }
      })

      if (!result || !Array.isArray(result.images) || result.images.length === 0) {
        setError('😿 生成成功但没有返回图像，请稍后重试')
        return
      }

      setResultSeed(result.seed ? String(result.seed) : '')
      setImages(normalizeImages(result.images))
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
            <div className="panel-card">
              <h2>🔑 Fal.ai API Key</h2>
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
              <h2>⚙️ 参数设置</h2>
              <div className="field-grid">
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

                <div className="field-group">
                  <label htmlFor="seedream-num">生成批次</label>
                  <input
                    id="seedream-num"
                    type="number"
                    min={1}
                    value={numImages}
                    onChange={(event) => setNumImages(Number.parseInt(event.target.value, 10) || 1)}
                  />
                </div>

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
              ) : (
                '✨ 生成图像'
              )}
            </button>

            {error && <p className="error-banner" role="alert">{error}</p>}
          </section>

          <section className="seedream-output" aria-label="生成结果区域">
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
