import { useState, useRef } from 'react'

/**
 * 图片生成页面组件
 * 使用火山引擎 Seedream 4.0 API 生成图片
 */
function ImageGenerator() {
  // 状态管理
  const [prompt, setPrompt] = useState('') // 用户输入的提示词
  const [uploadedImage, setUploadedImage] = useState(null) // 上传的图片（base64）
  const [imagePreview, setImagePreview] = useState(null) // 图片预览 URL
  const [size, setSize] = useState('2K') // 图片尺寸
  const [numImages, setNumImages] = useState(1) // 生成图片数量
  const [watermark, setWatermark] = useState(false) // 是否添加水印
  const [sequentialGeneration, setSequentialGeneration] = useState('disabled') // 连续生成模式（auto 或 disabled）
  const [loading, setLoading] = useState(false) // 加载状态
  const [error, setError] = useState(null) // 错误信息
  const [generatedImages, setGeneratedImages] = useState([]) // 生成的图片列表
  
  const fileInputRef = useRef(null) // 文件输入引用

  // API 配置
  // 开发环境使用 Vite 代理，生产环境使用 Serverless 函数代理
  const isDevelopment = import.meta.env.DEV
  const API_ENDPOINT = isDevelopment 
    ? '/api/v3/images/generations'  // 开发环境：Vite 代理
    : '/api/generate-image'          // 生产环境：Serverless 函数
  const API_KEY = '85e498e4-2b40-4b94-85ca-60bd022ae24c'

  /**
   * 处理图片上传
   * 将图片转换为 base64 格式
   */
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('🐱 请上传图片文件哦！')
      return
    }

    // 验证文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('🐱 图片太大啦！请上传小于 10MB 的图片')
      return
    }

    const reader = new FileReader()
    
    reader.onload = (event) => {
      const base64String = event.target.result
      setUploadedImage(base64String)
      setImagePreview(base64String)
      setError(null)
    }
    
    reader.onerror = () => {
      setError('😿 图片读取失败，请重试')
    }
    
    reader.readAsDataURL(file)
  }

  /**
   * 清除上传的图片
   */
  const clearUploadedImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * 调用火山引擎 Seedream 4.0 API 生成图片
   */
  const generateImage = async () => {
    // 验证输入
    if (!prompt.trim()) {
      setError('🐱 喵~ 请输入图片描述哦！')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedImages([])

    try {
      // 构建提示词：如果是组图模式，自动添加生成多张的提示
      let finalPrompt = prompt
      if (sequentialGeneration === 'auto' && numImages > 1) {
        finalPrompt = `${prompt}。生成一组共${numImages}张连贯的图片`
      }

      // 构建请求体
      const requestBody = {
        model: 'doubao-seedream-4-0-250828',
        prompt: finalPrompt,
        size: size,
        stream: true,  // 默认开启流式输出
        response_format: 'url',
        watermark: watermark
      }

      // 如果需要生成多张图片（组图模式）
      if (sequentialGeneration === 'auto' && numImages > 1) {
        requestBody.sequential_image_generation = 'auto'
        requestBody.sequential_image_generation_options = {
          max_images: numImages
        }
      } else {
        requestBody.sequential_image_generation = 'disabled'
      }

      // 如果有上传的图片，添加到请求中（图生图）
      if (uploadedImage) {
        requestBody.image = uploadedImage
      }

      // 调试日志：查看请求参数
      console.log('🐱 请求参数:', requestBody)
      console.log('📋 完整参数 JSON:', JSON.stringify(requestBody, null, 2))
      console.log('🔢 生成数量 n:', requestBody.n)
      console.log('🔄 sequential_image_generation:', requestBody.sequential_image_generation)
      console.log('📐 size:', requestBody.size)

      // 发送 API 请求
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '图片生成失败')
      }

      // 处理流式响应
      if (requestBody.stream) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        const allImages = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim()
              if (jsonStr === '[DONE]') continue
              
              try {
                const data = JSON.parse(jsonStr)
                console.log('🎨 流式数据:', data)
                
                // 处理流式图片生成成功事件
                if (data.type === 'image_generation.partial_succeeded' && data.url) {
                  // 添加新生成的图片
                  allImages.push({
                    url: data.url,
                    size: data.size,
                    image_index: data.image_index
                  })
                  
                  // 实时更新显示
                  setGeneratedImages(allImages.map((img, index) => ({
                    url: img.url,
                    size: img.size,
                    index: index + 1
                  })))
                  
                  console.log(`✅ 第 ${allImages.length} 张图片已生成`)
                }
                
                // 处理完成事件
                if (data.type === 'image_generation.completed') {
                  console.log('🎉 所有图片生成完成！', data.usage)
                }
              } catch (e) {
                console.warn('解析流式数据失败:', e)
              }
            }
          }
        }

        console.log('📊 最终图片数量:', allImages.length)
        
        if (allImages.length === 0) {
          throw new Error('未能生成图片')
        }
      } else {
        // 非流式响应处理
        const data = await response.json()
        console.log('🎨 API 响应:', data)
        console.log('📊 返回图片数量:', data.data?.length || 0)
        
        if (data.data && data.data.length > 0) {
          setGeneratedImages(data.data.map((img, index) => ({
            url: img.url,
            size: img.size,
            index: index + 1
          })))
        } else {
          throw new Error('未能生成图片')
        }
      }

    } catch (err) {
      setError(`😿 生成失败：${err.message}`)
      console.error('图片生成错误:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 重置表单
   */
  const resetForm = () => {
    setPrompt('')
    clearUploadedImage()
    setSize('2K')
    setNumImages(1)
    setWatermark(true)
    setSequentialGeneration('disabled')
    setGeneratedImages([])
    setError(null)
  }

  return (
    <div className="container">
      {/* 页面标题 - 橘猫主题 */}
      <header className="page-header">
        <h1>🎨 橘猫的画板 🐾</h1>
        <p>用 AI 的魔法，把想象变成现实 ✨</p>
      </header>

      {/* 图片生成表单 */}
      <section className="image-generator-section">
        <div className="generator-form">
          <h2>🖌️ 描述你的画面</h2>
          
          {/* 提示词输入 */}
          <div className="form-group">
            <label htmlFor="prompt">
              <span className="label-icon">💭</span>
              <span className="label-text">图片描述（必填）</span>
            </label>
            <textarea
              id="prompt"
              className="input textarea-input"
              placeholder="例如：一只可爱的桔猫趴在阳光下的窗台上，毛茸茸的，温暖的光线..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          {/* 图片上传（图生图） */}
          <div className="form-group">
            <label htmlFor="imageUpload">
              <span className="label-icon">🖼️</span>
              <span className="label-text">上传参考图片（可选）</span>
            </label>
            <div className="image-upload-container">
              <input
                ref={fileInputRef}
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="file-input"
              />
              <label htmlFor="imageUpload" className="file-input-label">
                <span>📷 {imagePreview ? '更换图片' : '选择图片'}</span>
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearUploadedImage}
                  className="clear-image-button"
                  disabled={loading}
                >
                  ❌ 清除
                </button>
              )}
            </div>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="预览" />
              </div>
            )}
            <p className="input-hint">💡 上传图片后，AI 会根据图片和描述生成新图（图生图）</p>
          </div>

          {/* 图片尺寸选择 */}
          <div className="form-group">
            <label htmlFor="size">
              <span className="label-icon">📐</span>
              <span className="label-text">图片尺寸</span>
            </label>
            <select
              id="size"
              className="input select-input"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={loading}
            >
              <option value="1K">1K (标清)</option>
              <option value="2K">2K (高清)</option>
              <option value="4K">4K (超高清)</option>
            </select>
          </div>

          {/* 连续生成模式 */}
          <div className="form-group">
            <label htmlFor="sequentialGeneration">
              <span className="label-icon">🔄</span>
              <span className="label-text">连续生成模式</span>
            </label>
            <select
              id="sequentialGeneration"
              className="input select-input"
              value={sequentialGeneration}
              onChange={(e) => setSequentialGeneration(e.target.value)}
              disabled={loading}
            >
              <option value="disabled">禁用（生成 1 张）</option>
              <option value="auto">自动（生成多张）</option>
            </select>
          </div>

          {/* 生成数量（仅当连续生成启用时） */}
          {sequentialGeneration === 'auto' && (
            <div className="form-group">
              <label htmlFor="numImages">
                <span className="label-icon">🔢</span>
                <span className="label-text">生成数量（1-15）</span>
              </label>
              <input
                id="numImages"
                type="number"
                min="1"
                max="15"
                className="input"
                value={numImages}
                onChange={(e) => setNumImages(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={loading}
              />
              <p className="input-hint">💡 最多可一次生成 15 张图片</p>
            </div>
          )}

          {/* 水印设置 */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                disabled={loading}
                className="checkbox-input"
              />
              <span className="checkbox-text">💧 添加水印</span>
            </label>
            <p className="input-hint">💡 建议保持开启，符合使用规范</p>
          </div>

          {/* 操作按钮 */}
          <div className="form-actions">
            <button
              className="primary-button"
              onClick={generateImage}
              disabled={loading}
            >
              {loading ? '🐱 生成中...' : '✨ 生成图片'}
            </button>
            <button
              className="secondary-button"
              onClick={resetForm}
              disabled={loading}
            >
              🔄 重置
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* 生成结果展示 */}
        {generatedImages.length > 0 && (
          <div className="result-section">
            <h2>🎉 生成成功！共 {generatedImages.length} 张图片</h2>
            
            {/* 图片网格展示 */}
            <div className="generated-images-grid">
              {generatedImages.map((image) => (
                <div key={image.index} className="generated-image-card">
                  <div className="image-number">#{image.index}</div>
                  <img
                    src={image.url}
                    alt={`AI生成的图片 ${image.index}`}
                    className="generated-image"
                    loading="lazy"
                  />
                  
                  {/* 图片信息 */}
                  <div className="image-info">
                    <p>
                      <span className="info-label">📏 尺寸：</span>
                      <span className="info-value">{image.size}</span>
                    </p>
                  </div>

                  {/* 下载按钮 */}
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-button"
                  >
                    📥 查看原图
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 使用提示 */}
      <section className="tips-section">
        <h2>💡 使用小贴士</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>🎯 描述要具体</h3>
            <p>详细描述画面元素、风格、光线等，效果会更好哦！</p>
          </div>
          <div className="tip-card">
            <h3>🖼️ 图生图功能</h3>
            <p>上传图片后，AI 会基于图片内容和你的描述生成新图</p>
          </div>
          <div className="tip-card">
            <h3>🔄 批量生成</h3>
            <p>启用连续生成模式，一次最多可生成 15 张图片</p>
          </div>
          <div className="tip-card">
            <h3>📐 尺寸选择</h3>
            <p>支持 1K、2K、4K 三种分辨率，4K 可达超高清画质</p>
          </div>
          <div className="tip-card">
            <h3>⚡ 耐心等待</h3>
            <p>高质量图片生成需要一点时间，请耐心等待~</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ImageGenerator
