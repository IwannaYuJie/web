// React 17+ JSX 自动导入
import { downloadImage } from '../../utils'

/**
 * 图片结果展示组件
 */
function ImageResults({
  images,
  loading,
  error,
  resultSeed,
  emptyText = '点击「开始生成」查看结果~'
}) {
  return (
    <div className="output-card">
      <h2>🎨 生成结果</h2>

      {error && <p className="error-banner" role="alert">{error}</p>}

      {loading && (
        <div className="output-loading">
          <span className="seedream-loader" aria-hidden="true" />
          <p>正在生成中，请稍候...</p>
        </div>
      )}

      {!loading && images.length === 0 && !error && (
        <div className="output-placeholder">
          <p>{emptyText}</p>
        </div>
      )}

      {images.length > 0 && (
        <>
          {resultSeed && (
            <p className="result-seed">🌱 Seed: {resultSeed}</p>
          )}
          <div className="seedream-gallery">
            {images.map((img, index) => (
              <figure key={index} className="seedream-image-card">
                <img
                  src={img.src}
                  alt={`生成图片 ${index + 1}`}
                  loading="lazy"
                />
                <figcaption>
                  <button
                    type="button"
                    className="download-link"
                    onClick={() => downloadImage(img.src, img.downloadName)}
                  >
                    ⬇️ 下载图片
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ImageResults
