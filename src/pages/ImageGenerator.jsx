import { useState, useRef, useEffect } from 'react'

/**
 * 图片生成页面组件
 * 使用火山引擎 Seedream 4.0 API 生成图片
 */
function ImageGenerator() {
  // 状态管理
  const [prompt, setPrompt] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [sizeMode, setSizeMode] = useState('aspectRatio')
  const [aspectRatio, setAspectRatio] = useState([1, 1])
  const [resolution, setResolution] = useState('2K')
  const [numImages, setNumImages] = useState(2)
  const [watermark, setWatermark] = useState(false)
  const [sequentialGeneration, setSequentialGeneration] = useState('disabled')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedImages, setGeneratedImages] = useState([])
  const [usageInfo, setUsageInfo] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [imageHistory, setImageHistory] = useState([])
  const [_showHistory, _setShowHistory] = useState(false)

  const fileInputRef = useRef(null)

  // Options
  const aspectRatioOptions = [
    { label: '9:16 (竖屏)', value: [9, 16], pixels: [2304, 4096] },
    { label: '16:9 (横屏)', value: [16, 9], pixels: [4096, 2304] },
    { label: '1:1 (方形)', value: [1, 1], pixels: [4096, 4096] }
  ]
  const resolutionOptions = [
    { label: '1K (标清)', value: '1K' },
    { label: '2K (高清)', value: '2K' },
    { label: '4K (超高清)', value: '4K' }
  ]
  const numImagesOptions = [2, 5, 10, 15]

  const getSizeParam = () => {
    if (sizeMode === 'aspectRatio') {
      const option = aspectRatioOptions.find(opt => opt.value[0] === aspectRatio[0] && opt.value[1] === aspectRatio[1])
      const pixels = option ? option.pixels : [4096, 4096]
      return `${pixels[0]}x${pixels[1]}`
    }
    return resolution
  }

  const artStyles = [
    { id: 'anime', name: '🎌 动漫风格', prompt: '动漫风格，精致的画风，日系插画' },
    { id: 'realistic', name: '📷 写实摄影', prompt: '超写实，高清摄影，专业摄影作品' },
    { id: 'oil', name: '🎨 油画艺术', prompt: '油画风格，印象派，艺术大师作品' },
    { id: 'watercolor', name: '🖌️ 水彩画风', prompt: '水彩画，柔和的色彩，艺术感' },
    { id: 'cyberpunk', name: '🌃 赛博朋克', prompt: '赛博朋克风格，霓虹灯，未来科技感' },
    { id: 'fantasy', name: '🏰 奇幻世界', prompt: '奇幻风格，魔法世界，史诗感' },
  ]

  const promptTemplates = [
    { id: 'cat', category: '🐱 橘猫系列', name: '慵懒橘猫', prompt: '一只胖胖的橘猫，慵懒地躺在阳光下的窗台上，毛茸茸的，温暖的午后阳光洒在它身上，背景是温馨的家居环境' },
    { id: 'nature', category: '🌸 自然风景', name: '樱花盛开', prompt: '春天的樱花树下，粉色花瓣飘落，唯美浪漫的氛围，柔和的光线，梦幻般的场景' },
    { id: 'city', category: '🏙️ 城市建筑', name: '未来都市', prompt: '未来科技城市，高楼大厦，飞行汽车，霓虹灯光，赛博朋克风格，夜景，科幻感' },
  ]

  const API_ENDPOINT = '/api/generate-image'

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) {return}
    if (!file.type.startsWith('image/')) {
      setError('🐱 请上传图片文件哦！')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('🐱 图片太大啦！请上传小于 10MB 的图片')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target.result)
      setImagePreview(event.target.result)
      setError(null)
    }
    reader.onerror = () => setError('😿 图片读取失败，请重试')
    reader.readAsDataURL(file)
  }

  const clearUploadedImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {fileInputRef.current.value = ''}
  }

  const applyTemplate = (template) => {
    if (selectedTemplate === template.id) {
      setSelectedTemplate('')
    } else {
      setPrompt(template.prompt)
      setSelectedTemplate(template.id)
    }
  }

  const applyStyle = (style) => {
    if (selectedStyle === style.id) {
      setSelectedStyle('')
    } else {
      setSelectedStyle(style.id)
    }
  }

  const saveToHistory = (images, promptUsed) => {
    const historyItem = {
      id: Date.now(),
      prompt: promptUsed,
      images: images,
      timestamp: new Date().toLocaleString('zh-CN'),
      style: selectedStyle,
      aspectRatio: aspectRatio
    }
    const newHistory = [historyItem, ...imageHistory].slice(0, 10)
    setImageHistory(newHistory)
    localStorage.setItem('imageHistory', JSON.stringify(newHistory))
  }

  useEffect(() => {
    const savedHistory = localStorage.getItem('imageHistory')
    if (savedHistory) {
      try { setImageHistory(JSON.parse(savedHistory)) } catch (e) { console.error(e) }
    }
  }, [])

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('🐱 喵~ 请输入图片描述哦！')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedImages([])
    setUsageInfo(null)

    try {
      let finalPrompt = prompt
      const selectedStyleObj = artStyles.find(s => s.id === selectedStyle)
      if (selectedStyleObj) {finalPrompt = `${prompt}，${selectedStyleObj.prompt}`}
      if (sequentialGeneration === 'auto' && numImages > 1) {finalPrompt = `${finalPrompt}。生成一组共${numImages}张连贯的图片`}

      const requestBody = {
        model: 'doubao-seedream-4-0-250828',
        prompt: finalPrompt,
        size: getSizeParam(),
        stream: true,
        response_format: 'url',
        watermark: watermark
      }

      if (sequentialGeneration === 'auto' && numImages > 1) {
        requestBody.sequential_image_generation = 'auto'
        requestBody.sequential_image_generation_options = { max_images: numImages }
      } else {
        requestBody.sequential_image_generation = 'disabled'
      }

      if (uploadedImage) {requestBody.image = uploadedImage}

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '图片生成失败')
      }

      if (requestBody.stream) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        const allImages = []

        let reading = true
        while (reading) {
          const { done, value } = await reader.read()
          if (done) {
            reading = false
            break
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim()
              if (jsonStr === '[DONE]') {continue}
              try {
                const data = JSON.parse(jsonStr)
                if (data.type === 'image_generation.partial_succeeded' && data.url) {
                  allImages.push({ url: data.url, size: data.size, image_index: data.image_index })
                  setGeneratedImages(allImages.map((img, index) => ({ url: img.url, size: img.size, index: index + 1 })))
                }
                if (data.type === 'image_generation.completed') {setUsageInfo(data.usage)}
              } catch (e) { console.warn(e) }
            }
          }
        }
        if (allImages.length === 0) {throw new Error('未能生成图片')}
        saveToHistory(allImages.map((img, index) => ({ url: img.url, size: img.size, index: index + 1 })), finalPrompt)
      } else {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          const images = data.data.map((img, index) => ({ url: img.url, size: img.size, index: index + 1 }))
          setGeneratedImages(images)
          saveToHistory(images, finalPrompt)
        } else {
          throw new Error('未能生成图片')
        }
      }
    } catch (err) {
      let errorMessage = err.message
      if (err.message.includes('524') || err.message.includes('timeout')) {
        errorMessage = '⏱️ 生成超时了！建议：减少生成数量或使用较低分辨率'
      }
      setError(`😿 生成失败：${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPrompt('')
    clearUploadedImage()
    setSizeMode('aspectRatio')
    setAspectRatio([1, 1])
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
    <div className="container pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <header className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-extrabold mb-4 text-gradient">🎨 橘猫的画板</h1>
        <p className="text-text-secondary">用 AI 的魔法，把想象变成现实 ✨</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-6 animate-slide-up">

          {/* Upload Area */}
          <div className="glass p-6 rounded-2xl">
             <h3 className="font-bold mb-4 flex items-center gap-2">
               <span>🖼️</span> 参考图片 (可选)
             </h3>
             <div
               className={`
                 border-2 border-dashed border-primary/30 rounded-xl p-6 text-center transition-all cursor-pointer relative overflow-hidden
                 ${imagePreview ? 'bg-black/5' : 'bg-white/50 hover:bg-primary/5 hover:border-primary'}
               `}
               onClick={() => !imagePreview && fileInputRef.current?.click()}
             >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                    <button
                      onClick={(e) => { e.stopPropagation(); clearUploadedImage(); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <div className="py-8 text-text-light">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm">点击上传或拖拽图片</p>
                    <p className="text-xs opacity-60 mt-1">支持 JPG/PNG, Max 10MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
             </div>
          </div>

          {/* Settings */}
          <div className="glass p-6 rounded-2xl space-y-6">
             <h3 className="font-bold flex items-center gap-2">
               <span>⚙️</span> 生成设置
             </h3>

             {/* Size Mode */}
             <div className="space-y-2">
               <label className="text-xs font-bold text-text-light uppercase">尺寸模式</label>
               <div className="flex bg-white/50 p-1 rounded-lg">
                 {['aspectRatio', 'resolution'].map(mode => (
                   <button
                     key={mode}
                     onClick={() => setSizeMode(mode)}
                     className={`flex-1 py-2 text-sm rounded-md transition-all ${sizeMode === mode ? 'bg-white shadow-sm text-primary font-bold' : 'text-text-secondary'}`}
                   >
                     {mode === 'aspectRatio' ? '📐 宽高比' : '🎯 分辨率'}
                   </button>
                 ))}
               </div>
             </div>

             {/* Aspect Ratio Select */}
             {sizeMode === 'aspectRatio' && (
                <div className="grid grid-cols-3 gap-2">
                  {aspectRatioOptions.map(opt => {
                    const isSelected = aspectRatio[0] === opt.value[0] && aspectRatio[1] === opt.value[1]
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setAspectRatio(opt.value)}
                        className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-white/50'}`}
                      >
                        <span className="font-bold">{opt.value[0]}:{opt.value[1]}</span>
                        <span className="scale-75 opacity-70">{opt.label.split(' ')[1]}</span>
                      </button>
                    )
                  })}
                </div>
             )}

             {/* Resolution Select */}
             {sizeMode === 'resolution' && (
                <div className="grid grid-cols-3 gap-2">
                  {resolutionOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setResolution(opt.value)}
                      className={`p-2 rounded-lg border text-xs transition-all ${resolution === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-white/50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
             )}

             {/* Advanced Settings */}
             <div className="pt-4 border-t border-border-color space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-sm text-text-secondary">连续生成</span>
                 <select
                   value={sequentialGeneration}
                   onChange={(e) => setSequentialGeneration(e.target.value)}
                   className="bg-white/50 border-none text-sm rounded-lg p-1 outline-none"
                 >
                   <option value="disabled">单张</option>
                   <option value="auto">连贯多图</option>
                 </select>
               </div>

               {sequentialGeneration === 'auto' && (
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-text-secondary">数量</span>
                   <div className="flex gap-1">
                     {numImagesOptions.map(num => (
                       <button
                         key={num}
                         onClick={() => setNumImages(num)}
                         className={`w-8 h-8 rounded-lg text-xs ${numImages === num ? 'bg-primary text-white' : 'bg-white/50'}`}
                       >
                         {num}
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="accent-primary" />
                 <span className="text-sm text-text-secondary">添加水印 (Watermark)</span>
               </label>
             </div>
          </div>
        </div>

        {/* Right Display Area */}
        <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>

           {/* Prompt Input */}
           <div className="glass p-6 rounded-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <span>💭</span> 创意描述
                </h3>
                <button onClick={resetForm} className="text-xs text-text-secondary hover:text-primary">🔄 重置所有</button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想象中的画面，越具体越好..."
                  className="w-full p-4 rounded-xl bg-white/50 border-2 border-transparent focus:border-primary/50 focus:bg-white outline-none transition-all resize-none min-h-[120px] text-text-color"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                   <button
                     onClick={generateImage}
                     disabled={loading || !prompt.trim()}
                     className="btn btn-primary px-6 py-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loading ? '🎨 绘制中...' : '✨ 开始生成'}
                   </button>
                </div>
              </div>

              {/* Templates & Styles Pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                 {promptTemplates.slice(0, 3).map(t => (
                   <button
                     key={t.id}
                     onClick={() => applyTemplate(t)}
                     className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedTemplate === t.id ? 'bg-secondary text-white border-secondary' : 'bg-white/30 border-border-color hover:border-primary text-text-secondary'}`}
                   >
                     📝 {t.name}
                   </button>
                 ))}
                 <div className="w-px h-6 bg-border-color mx-2"></div>
                 {artStyles.slice(0, 4).map(s => (
                   <button
                     key={s.id}
                     onClick={() => applyStyle(s)}
                     className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedStyle === s.id ? 'bg-accent text-white border-accent' : 'bg-white/30 border-border-color hover:border-primary text-text-secondary'}`}
                   >
                     🎨 {s.name}
                   </button>
                 ))}
              </div>
           </div>

           {/* Results Area */}
           <div className="min-h-[400px] glass rounded-2xl p-6 relative">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 animate-bounce">
                   {error}
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl z-10">
                   <div className="text-6xl animate-bounce mb-4">🖌️</div>
                   <p className="font-bold text-primary animate-pulse">AI 正在挥毫泼墨...</p>
                </div>
              )}

              {generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((img) => (
                    <div key={img.index} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-black/5">
                      <img src={img.url} alt={`Generated ${img.index}`} className="w-full h-auto object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                        <a href={img.url} target="_blank" rel="noreferrer" className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors" title="查看原图">
                          👁️
                        </a>
                        <a href={img.url} download className="p-3 bg-primary hover:bg-primary-hover rounded-full text-white shadow-lg transition-colors" title="下载">
                          📥
                        </a>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-md">
                         {img.size}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-light opacity-60 py-20">
                   <div className="text-6xl mb-4 grayscale">🖼️</div>
                   <p>生成的图片将在这里展示</p>
                </div>
              )}

              {usageInfo && (
                 <div className="mt-4 pt-4 border-t border-border-color flex justify-end text-xs text-text-light gap-4">
                    <span>Token消耗: {usageInfo.total_tokens}</span>
                    <span>生成数量: {usageInfo.generated_images}</span>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  )
}

export default ImageGenerator
