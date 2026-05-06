import { useState, useRef, useEffect } from 'react';
import GIF from 'gif.js/dist/gif';
import './SpriteSheetToGif.css';

function SpriteSheetToGif() {
  const [image, setImage] = useState(null);
  const [_imageFile, setImageFile] = useState(null);
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(1);
  const [fps, setFps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGif, setGeneratedGif] = useState(null);

  const gridCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const frameIndexRef = useRef(0);

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage({
          src: img.src,
          width: img.width,
          height: img.height,
          element: img
        });
        setImageFile(file);
        setGeneratedGif(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Draw Grid View
  useEffect(() => {
    if (!image || !gridCanvasRef.current) {return;}

    const canvas = gridCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Resize canvas to fit image but keep aspect ratio if too big
    // For grid view, we might want to show the whole image scaled down if necessary
    // But for the tool to be precise, maybe scrollable is better.
    // Let's just set canvas size to image size for now and let CSS handle scaling/scroll
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw image
    ctx.drawImage(image.element, 0, 0);

    // Draw Grid
    const frameWidth = image.width / cols;
    const frameHeight = image.height / rows;

    ctx.strokeStyle = '#00ff00'; // Green grid
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Vertical lines
    for (let i = 1; i < cols; i++) {
      ctx.moveTo(i * frameWidth, 0);
      ctx.lineTo(i * frameWidth, image.height);
    }

    // Horizontal lines
    for (let i = 1; i < rows; i++) {
      ctx.moveTo(0, i * frameHeight);
      ctx.lineTo(image.width, i * frameHeight);
    }

    ctx.stroke();

  }, [image, cols, rows]);

  // Animation Preview Loop
  useEffect(() => {
    if (!image || !previewCanvasRef.current) {return;}

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const frameWidth = image.width / cols;
    const frameHeight = image.height / rows;

    canvas.width = frameWidth;
    canvas.height = frameHeight;

    const totalFrames = cols * rows;

    const renderFrame = () => {
      const currentFrame = frameIndexRef.current;
      const colIndex = currentFrame % cols;
      const rowIndex = Math.floor(currentFrame / cols);

      const sx = colIndex * frameWidth;
      const sy = rowIndex * frameHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image.element,
        sx, sy, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight
      );

      if (isPlaying) {
        frameIndexRef.current = (currentFrame + 1) % totalFrames;
      }
    };

    // Initial render
    renderFrame();

    if (isPlaying) {
      const interval = 1000 / fps;
      animationRef.current = setInterval(renderFrame, interval);
    }

    return () => {
      if (animationRef.current) {clearInterval(animationRef.current);}
    };
  }, [image, cols, rows, fps, isPlaying]);

  const handleGenerateGif = () => {
    if (!image) {return;}
    setIsGenerating(true);

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: '/gif.worker.js', // Path to worker in public folder
      width: image.width / cols,
      height: image.height / rows
    });

    const frameWidth = image.width / cols;
    const frameHeight = image.height / rows;
    const totalFrames = cols * rows;

    // Create a temporary canvas to extract frames
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameWidth;
    tempCanvas.height = frameHeight;
    const ctx = tempCanvas.getContext('2d');

    for (let i = 0; i < totalFrames; i++) {
      const colIndex = i % cols;
      const rowIndex = Math.floor(i / cols);
      const sx = colIndex * frameWidth;
      const sy = rowIndex * frameHeight;

      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.drawImage(
        image.element,
        sx, sy, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight
      );

      gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
    }

    gif.on('finished', (blob) => {
      setGeneratedGif(URL.createObjectURL(blob));
      setIsGenerating(false);
    });

    gif.render();
  };

  const frameWidth = image ? Math.round(image.width / cols) : 0;
  const frameHeight = image ? Math.round(image.height / rows) : 0;

  return (
    <div className="container pb-12 animate-fade-in">
      <section className="glass rounded-[32px] p-8 md:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full mb-3 text-primary font-bold text-sm backdrop-blur-sm">
            <span>🎞️</span>
            <span>精灵图工具</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-gradient leading-tight">
            精灵图转 GIF
          </h1>
          <p className="text-base text-text-secondary leading-relaxed">
            上传精灵图 → 设置行列 → 调速 → 一键生成 GIF。整个流程在浏览器里完成。
          </p>
        </div>
        <div className="relative z-10 text-6xl md:text-7xl select-none" aria-hidden="true">
          🐱
        </div>
        <div className="absolute top-0 right-0 w-56 h-56 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </section>

      <div className="tool-container">
        {/* Left Panel: Controls */}
        <div className="left-panel">
          {/* 1. Image Selection */}
          <div className="tool-panel">
            <h3>🖼️ 1. 选择图像</h3>
            <label className="upload-area">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <span className="upload-icon">📤</span>
              <p>点击或拖拽上传</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PNG, JPG (推荐透明背景)</p>
            </label>
          </div>

          {/* 2. Split Settings */}
          <div className="tool-panel">
            <h3>✂️ 2. 分割设置</h3>
            <div className="setting-group">
              <div className="setting-row">
                <div className="setting-item">
                  <label>横向分割数 (列)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={cols}
                    min="1"
                    onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="setting-item">
                  <label>纵向分割数 (行)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={rows}
                    min="1"
                    onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
            </div>

            <div className="setting-group">
              <label>动画速度 (FPS): {fps}</label>
              <input
                type="range"
                min="1"
                max="60"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-color)' }}
              />
            </div>

            {image && (
              <div className="info-display">
                <div className="info-row">
                  <span>图像尺寸:</span>
                  <span>{image.width}px x {image.height}px</span>
                </div>
                <div className="info-row">
                  <span>单帧尺寸:</span>
                  <span>{frameWidth}px x {frameHeight}px</span>
                </div>
                <div className="info-row">
                  <span>总帧数:</span>
                  <span>{cols * rows}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Preview */}
          <div className="tool-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>▷ 3. 预览</h3>
              <button
                className="control-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "暂停" : "播放"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
            </div>

            <div className="preview-box">
              {image ? (
                <canvas ref={previewCanvasRef} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>等待上传...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Grid View & Generate */}
        <div className="right-panel">
          <div className="tool-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3>⚙️ 分割确认 (网格)</h3>
            <div className="grid-view-container" style={{ flex: 1, minHeight: '400px' }}>
              {image ? (
                <canvas ref={gridCanvasRef} style={{ maxWidth: '100%' }} />
              ) : (
                <div className="empty-state">
                  <span style={{ fontSize: '3rem' }}>🖼️</span>
                  <p>请从左侧面板上传图像</p>
                </div>
              )}
            </div>

            <button
              className="primary-button generate-btn"
              onClick={handleGenerateGif}
              disabled={!image || isGenerating}
              style={{ opacity: (!image || isGenerating) ? 0.7 : 1, cursor: (!image || isGenerating) ? 'not-allowed' : 'pointer' }}
            >
              {isGenerating ? '⏳ 生成中...' : '🎞️ 生成 GIF 动画'}
            </button>

            {generatedGif && (
              <div style={{ marginTop: '1rem', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                <p style={{ marginBottom: '0.5rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>✨ 生成成功!</p>
                <img src={generatedGif} alt="Generated GIF" style={{ maxWidth: '100%', border: '2px solid var(--primary-color)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                <a
                  href={generatedGif}
                  download="sprite-animation.gif"
                  className="secondary-button"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                  ⬇️ 下载 GIF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpriteSheetToGif;
