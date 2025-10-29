import React, { useState, useRef } from 'react'

/**
 * 图片生成页面组件
 * 使用火山引擎 Seedream 4.0 API 生成图片
 * 
 * 功能特性：
 * 1. 文生图 - 根据文字描述生成图片
 * 2. 图生图 - 上传参考图片进行二次创作
 * 3. 预设模板 - 快速选择常用提示词
 * 4. 艺术风格 - 多种艺术风格可选
 * 5. 历史记录 - 保存和查看生成历史
 * 6. 批量生成 - 支持连续生成多张图片
 */
function ImageGenerator() {
  // 状态管理
  const [prompt, setPrompt] = useState('') // 用户输入的提示词
  const [uploadedImage, setUploadedImage] = useState(null) // 上传的图片（base64）
  const [imagePreview, setImagePreview] = useState(null) // 图片预览 URL
  const [sizeMode, setSizeMode] = useState('aspectRatio') // 尺寸选择模式: 'aspectRatio' 或 'resolution'
  const [aspectRatio, setAspectRatio] = useState([1, 1]) // 图片宽高比 [宽, 高]
  const [resolution, setResolution] = useState('2K') // 分辨率选择: 1K/2K/4K
  const [numImages, setNumImages] = useState(2) // 生成图片数量
  const [watermark, setWatermark] = useState(false) // 是否添加水印
  const [sequentialGeneration, setSequentialGeneration] = useState('disabled') // 连续生成模式（auto 或 disabled）
  const [loading, setLoading] = useState(false) // 加载状态
  const [error, setError] = useState(null) // 错误信息
  const [generatedImages, setGeneratedImages] = useState([]) // 生成的图片列表
  const [usageInfo, setUsageInfo] = useState(null) // API使用统计信息
  const [selectedStyle, setSelectedStyle] = useState('') // 选中的艺术风格
  const [selectedTemplate, setSelectedTemplate] = useState('') // 选中的提示词模板
  const [imageHistory, setImageHistory] = useState([]) // 历史生成记录
  const [showHistory, setShowHistory] = useState(false) // 是否显示历史记录
  
  const fileInputRef = useRef(null) // 文件输入引用

  /**
   * 宽高比配置
   * 根据火山引擎API文档,支持的最大像素范围为4096
   * 按照宽高比计算,保证最长边为4096
   */
  const aspectRatioOptions = [
    { label: '9:16 (竖屏)', value: [9, 16], pixels: [2304, 4096] },
    { label: '16:9 (横屏)', value: [16, 9], pixels: [4096, 2304] },
    { label: '1:1 (方形)', value: [1, 1], pixels: [4096, 4096] }
  ]

  /**
   * 分辨率选项配置
   */
  const resolutionOptions = [
    { label: '1K (标清)', value: '1K' },
    { label: '2K (高清)', value: '2K' },
    { label: '4K (超高清)', value: '4K' }
  ]

  /**
   * 生成数量选项
   */
  const numImagesOptions = [2, 5, 10, 15]

  /**
   * 根据当前模式获取size参数
   */
  const getSizeParam = () => {
    if (sizeMode === 'aspectRatio') {
      // 宽高比模式: 返回 "宽x高" 格式
      const option = aspectRatioOptions.find(
        opt => opt.value[0] === aspectRatio[0] && opt.value[1] === aspectRatio[1]
      )
      const pixels = option ? option.pixels : [4096, 4096]
      return `${pixels[0]}x${pixels[1]}`
    } else {
      // 分辨率模式: 返回 1K/2K/4K
      return resolution
    }
  }

  /**
   * 预设艺术风格配置
   * 每个风格包含：id（唯一标识）、name（显示名称）、prompt（风格描述词）
   */
  const artStyles = [
    { id: 'anime', name: '🎌 动漫风格', prompt: '动漫风格，精致的画风，日系插画' },
    { id: 'realistic', name: '📷 写实摄影', prompt: '超写实，高清摄影，专业摄影作品' },
    { id: 'oil', name: '🎨 油画艺术', prompt: '油画风格，印象派，艺术大师作品' },
    { id: 'watercolor', name: '🖌️ 水彩画风', prompt: '水彩画，柔和的色彩，艺术感' },
    { id: 'cyberpunk', name: '🌃 赛博朋克', prompt: '赛博朋克风格，霓虹灯，未来科技感' },
    { id: 'fantasy', name: '🏰 奇幻世界', prompt: '奇幻风格，魔法世界，史诗感' },
    { id: 'minimalist', name: '⚪ 极简主义', prompt: '极简风格，简洁，现代设计' },
    { id: 'vintage', name: '📻 复古怀旧', prompt: '复古风格，怀旧感，老照片质感' },
    { id: 'cartoon', name: '🎭 卡通漫画', prompt: '卡通风格，可爱，儿童插画' },
    { id: 'surreal', name: '🌀 超现实', prompt: '超现实主义，梦幻，艺术创意' }
  ]

  /**
   * 预设提示词模板配置
   * 按照分类组织，方便用户快速找到需要的模板
   * 每个模板包含：id、category（分类）、name（名称）、prompt（完整提示词）
   */
  const promptTemplates = [
    { 
      id: 'cat', 
      category: '🐱 橘猫系列',
      name: '慵懒橘猫',
      prompt: '一只胖胖的橘猫，慵懒地躺在阳光下的窗台上，毛茸茸的，温暖的午后阳光洒在它身上，背景是温馨的家居环境'
    },
    {
      id: 'cat2',
      category: '🐱 橘猫系列',
      name: '橘猫玩耍',
      prompt: '可爱的橘猫正在玩毛线球，活泼好动，眼睛明亮，在舒适的客厅里，柔和的灯光'
    },
    {
      id: 'nature',
      category: '🌸 自然风景',
      name: '樱花盛开',
      prompt: '春天的樱花树下，粉色花瓣飘落，唯美浪漫的氛围，柔和的光线，梦幻般的场景'
    },
    {
      id: 'sunset',
      category: '🌸 自然风景',
      name: '日落海滩',
      prompt: '金色的夕阳洒在海面上，波光粼粼，海滩上有细软的沙子，远处有椰子树，宁静祥和'
    },
    {
      id: 'food',
      category: '🍰 美食诱惑',
      name: '精致甜点',
      prompt: '精美的草莓蛋糕，奶油装饰，新鲜水果，咖啡店环境，温暖的灯光，食物摄影风格'
    },
    {
      id: 'coffee',
      category: '🍰 美食诱惑',
      name: '咖啡时光',
      prompt: '一杯热气腾腾的拿铁咖啡，精致的拉花，木质桌面，舒适的咖啡厅氛围，温暖色调'
    },
    {
      id: 'character',
      category: '👤 人物肖像',
      name: '温柔少女',
      prompt: '温柔的少女，长发飘飘，穿着淡雅的连衣裙，在花园里微笑，柔和的自然光，唯美风格'
    },
    {
      id: 'warrior',
      category: '👤 人物肖像',
      name: '勇敢战士',
      prompt: '英勇的战士，身穿铠甲，手持长剑，站在山巅，史诗感，壮丽的背景，电影级画面'
    },
    {
      id: 'city',
      category: '🏙️ 城市建筑',
      name: '未来都市',
      prompt: '未来科技城市，高楼大厦，飞行汽车，霓虹灯光，赛博朋克风格，夜景，科幻感'
    },
    {
      id: 'ancient',
      category: '🏙️ 城市建筑',
      name: '古风建筑',
      prompt: '中国古代建筑，亭台楼阁，小桥流水，古色古香，水墨画风格，诗意盎然'
    }
  ]

  /**
   * API 配置
   * 开发环境：使用 Vite 代理解决跨域问题
   * 生产环境：使用 Serverless 函数代理保护 API 密钥
   */
  const isDevelopment = import.meta.env.DEV
  const API_ENDPOINT = isDevelopment 
    ? '/api/v3/images/generations'  // 开发环境：Vite 代理
    : '/api/generate-image'          // 生产环境：Serverless 函数
  const API_KEY = 'd5409697-4157-4ea2-9265-782d9d59a810'

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
   * 应用选中的模板（支持取消选择）
   */
  const applyTemplate = (template) => {
    // 如果已经选中了该模板，取消选择
    if (selectedTemplate === template.id) {
      setSelectedTemplate('')
    } else {
      // 否则应用新模板
      setPrompt(template.prompt)
      setSelectedTemplate(template.id)
    }
  }

  /**
   * 应用艺术风格（支持取消选择）
   */
  const applyStyle = (style) => {
    // 如果已经选中了该风格，取消选择
    if (selectedStyle === style.id) {
      setSelectedStyle('')
    } else {
      // 否则应用新风格
      setSelectedStyle(style.id)
    }
  }

  /**
   * 保存到历史记录
   */
  const saveToHistory = (images, promptUsed) => {
    const historyItem = {
      id: Date.now(),
      prompt: promptUsed,
      images: images,
      timestamp: new Date().toLocaleString('zh-CN'),
      style: selectedStyle,
      aspectRatio: aspectRatio
    }
    const newHistory = [historyItem, ...imageHistory].slice(0, 10) // 只保留最近10条
    setImageHistory(newHistory)
    localStorage.setItem('imageHistory', JSON.stringify(newHistory))
  }

  /**
   * 加载历史记录
   */
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('imageHistory')
    if (savedHistory) {
      try {
        setImageHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('加载历史记录失败:', e)
      }
    }
  }, [])

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
    setUsageInfo(null) // 清空之前的统计信息

    try {
      // 构建提示词：添加艺术风格
      let finalPrompt = prompt
      const selectedStyleObj = artStyles.find(s => s.id === selectedStyle)
      if (selectedStyleObj) {
        finalPrompt = `${prompt}，${selectedStyleObj.prompt}`
      }
      
      // 如果是组图模式，自动添加生成多张的提示
      if (sequentialGeneration === 'auto' && numImages > 1) {
        finalPrompt = `${finalPrompt}。生成一组共${numImages}张连贯的图片`
      }

      // 构建请求体
      const requestBody = {
        model: 'doubao-seedream-4-0-250828',
        prompt: finalPrompt,
        size: getSizeParam(), // 根据选择模式获取size参数
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
                  // 保存usage统计信息
                  if (data.usage) {
                    setUsageInfo(data.usage)
                  }
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
        
        // 保存到历史记录
        saveToHistory(allImages.map((img, index) => ({
          url: img.url,
          size: img.size,
          index: index + 1
        })), finalPrompt)
      } else {
        // 非流式响应处理
        const data = await response.json()
        console.log('🎨 API 响应:', data)
        console.log('📊 返回图片数量:', data.data?.length || 0)
        
        if (data.data && data.data.length > 0) {
          const images = data.data.map((img, index) => ({
            url: img.url,
            size: img.size,
            index: index + 1
          }))
          setGeneratedImages(images)
          
          // 保存到历史记录
          saveToHistory(images, finalPrompt)
        } else {
          throw new Error('未能生成图片')
        }
      }

    } catch (err) {
      // 特殊处理超时错误
      let errorMessage = err.message
      if (err.message.includes('524') || err.message.includes('timeout') || err.message.includes('Unexpected token')) {
        errorMessage = '⏱️ 生成超时了！建议：\n1. 减少生成数量（1-3张）\n2. 使用较低分辨率（1K或2K）\n3. 简化提示词描述'
      }
      
      setError(`😿 生成失败：${errorMessage}`)
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
    setSizeMode('aspectRatio')
    setAspectRatio([1, 1]) // 重置为1:1
    setResolution('2K')
    setNumImages(2)
    setWatermark(true)
    setSequentialGeneration('disabled')
    setGeneratedImages([])
    setError(null)
    setSelectedStyle('')
    setSelectedTemplate('')
  }

  return (
    <div className="container">
      {/* 页面标题 - 橘猫主题 */}
      <header className="page-header">
        <h1>🎨 橘猫的画板 🐾</h1>
        <p>用 AI 的魔法，把想象变成现实 ✨</p>
      </header>

      {/* 快捷操作栏 */}
      <div className="quick-actions">
        <button 
          className={`action-button ${showHistory ? 'active' : ''}`}
          onClick={() => setShowHistory(!showHistory)}
        >
          📚 历史记录 {imageHistory.length > 0 && `(${imageHistory.length})`}
        </button>
      </div>

      {/* 历史记录面板 */}
      {showHistory && imageHistory.length > 0 && (
        <section className="history-section">
          <h2>📜 最近生成的作品</h2>
          <div className="history-grid">
            {imageHistory.map(item => (
              <div key={item.id} className="history-card">
                <div className="history-images">
                  {item.images.slice(0, 1).map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img.url} 
                      alt="历史图片" 
                      className="history-thumbnail"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                  {item.images.length > 1 && (
                    <div className="more-images">+{item.images.length - 1}</div>
                  )}
                </div>
                <div className="history-info">
                  <p className="history-prompt">{item.prompt.substring(0, 50)}...</p>
                  <p className="history-meta">
                    <span>📅 {item.timestamp}</span>
                    <span>📐 {item.aspectRatio ? `${item.aspectRatio[0]}:${item.aspectRatio[1]}` : item.size}</span>
                  </p>
                </div>
                <button 
                  className="use-prompt-button"
                  onClick={() => {
                    setPrompt(item.prompt)
                    if (item.aspectRatio) {
                      setAspectRatio(item.aspectRatio)
                    }
                    setSelectedStyle(item.style || '')
                    setShowHistory(false)
                  }}
                >
                  🔄 使用此提示词
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 图片生成表单 */}
      <section className="image-generator-section">
        <div className="generator-form">
          <h2>🖌️ 描述你的画面</h2>
          
          {/* 预设模板选择 */}
          <div className="form-group">
            <label>
              <span className="label-icon">📝</span>
              <span className="label-text">快速模板（可选）</span>
            </label>
            <div className="template-categories">
              {Array.from(new Set(promptTemplates.map(t => t.category))).map(category => (
                <div key={category} className="template-category">
                  <h4>{category}</h4>
                  <div className="template-grid">
                    {promptTemplates
                      .filter(t => t.category === category)
                      .map(template => (
                        <button
                          key={template.id}
                          className={`template-button ${selectedTemplate === template.id ? 'selected' : ''}`}
                          onClick={() => applyTemplate(template)}
                          disabled={loading}
                        >
                          {template.name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 艺术风格选择 */}
          <div className="form-group">
            <label>
              <span className="label-icon">🎨</span>
              <span className="label-text">艺术风格（可选）</span>
            </label>
            <div className="style-grid">
              {artStyles.map(style => (
                <button
                  key={style.id}
                  className={`style-button ${selectedStyle === style.id ? 'selected' : ''}`}
                  onClick={() => applyStyle(style)}
                  disabled={loading}
                  title={style.prompt}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
          
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

          {/* 尺寸选择模式 */}
          <div className="form-group">
            <label>
              <span className="label-icon">📐</span>
              <span className="label-text">尺寸选择方式</span>
            </label>
            <div className="size-mode-tabs">
              <button
                type="button"
                className={`mode-tab ${sizeMode === 'aspectRatio' ? 'active' : ''}`}
                onClick={() => setSizeMode('aspectRatio')}
                disabled={loading}
              >
                📐 宽高比
              </button>
              <button
                type="button"
                className={`mode-tab ${sizeMode === 'resolution' ? 'active' : ''}`}
                onClick={() => setSizeMode('resolution')}
                disabled={loading}
              >
                🎯 分辨率
              </button>
            </div>
          </div>

          {/* 宽高比选择 (当模式为aspectRatio时显示) */}
          {sizeMode === 'aspectRatio' && (
            <div className="form-group">
              <label htmlFor="aspectRatio">
                <span className="label-icon">📐</span>
                <span className="label-text">选择宽高比</span>
              </label>
              <select
                id="aspectRatio"
                className="input select-input"
                value={JSON.stringify(aspectRatio)}
                onChange={(e) => setAspectRatio(JSON.parse(e.target.value))}
                disabled={loading}
              >
                {aspectRatioOptions.map(option => (
                  <option key={option.label} value={JSON.stringify(option.value)}>
                    {option.label} - {option.pixels[0]}x{option.pixels[1]}
                  </option>
                ))}
              </select>
              <p className="input-hint">💡 已自动选择该比例下的最大分辨率</p>
            </div>
          )}

          {/* 分辨率选择 (当模式为resolution时显示) */}
          {sizeMode === 'resolution' && (
            <div className="form-group">
              <label htmlFor="resolution">
                <span className="label-icon">🎯</span>
                <span className="label-text">选择分辨率</span>
              </label>
              <select
                id="resolution"
                className="input select-input"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                disabled={loading}
              >
                {resolutionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="input-hint">💡 1K=标清, 2K=高清, 4K=超高清</p>
            </div>
          )}

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
                <span className="label-text">生成数量</span>
              </label>
              <select
                id="numImages"
                className="input select-input"
                value={numImages}
                onChange={(e) => setNumImages(parseInt(e.target.value))}
                disabled={loading}
              >
                {numImagesOptions.map(num => (
                  <option key={num} value={num}>
                    {num} 张
                  </option>
                ))}
              </select>
              <p className="input-hint">💡 建议 2-5 张（数量多或分辨率高可能超时）</p>
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
            <div className="result-header">
              <h2>🎉 生成成功！</h2>
              {usageInfo && (
                <div className="usage-info">
                  <span className="usage-item">
                    <span className="usage-label">🖼️ 生成图片数:</span>
                    <span className="usage-value">{usageInfo.generated_images}</span>
                  </span>
                  <span className="usage-item">
                    <span className="usage-label">📝 输出Token:</span>
                    <span className="usage-value">{usageInfo.output_tokens}</span>
                  </span>
                  <span className="usage-item">
                    <span className="usage-label">💰 总Token:</span>
                    <span className="usage-value">{usageInfo.total_tokens}</span>
                  </span>
                </div>
              )}
            </div>
            
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
            <h3>📐 宽高比选择</h3>
            <p>支持 9:16、16:9、1:1 三种宽高比，自动使用最大分辨率</p>
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
