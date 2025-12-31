// React 17+ JSX 自动导入
import { downloadImage } from '../../utils'

/**
 * 随机 Coser 生成面板组件
 */
function CoserPlayground({
  userInput,
  setUserInput,
  apiKey,
  loading,
  promptLoading,
  falLoading,
  qiniuLoading,
  error,
  step,
  prompt,
  falImage,
  qiniuImage,
  onGenerate
}) {
  const isGenerating = loading || promptLoading
  const hasResults = falImage || qiniuImage || falLoading || qiniuLoading

  return (
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
                onClick={() => setUserInput('')}
                disabled={!userInput}
              >
                清空
              </button>
            </div>
            <textarea
              id="coser-user-input"
              rows={3}
              placeholder="例如：穿和服、在樱花树下、甜美笑容、蓝色长发..."
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
            />
            <p className="panel-tip">留空则完全随机，填写后 AI 会在你的需求基础上生成提示词</p>
          </div>
        </div>

        {/* Fal API Key 提示 */}
        {!apiKey?.trim() && (
          <div className="panel-card warning-card">
            <p>⚠️ 请先切换到「Fal.ai Seedream」面板填写 API Key，才能使用双引擎生成功能</p>
          </div>
        )}

        <button
          type="button"
          className="generate-button coser-generate-button"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span>{step || '生成中...'}</span>
              <span className="seedream-loader" aria-hidden="true" />
            </>
          ) : (
            '🎀 一键生成随机 Coser'
          )}
        </button>

        {error && <p className="error-banner" role="alert">{error}</p>}

        {/* 生成的提示词展示 */}
        {prompt && (
          <div className="panel-card coser-prompt-card">
            <h2>📝 生成的提示词</h2>
            <div className="coser-prompt-content">
              <p>{prompt}</p>
            </div>
          </div>
        )}
      </section>

      <section
        className={`seedream-output coser-output ${!hasResults && !isGenerating ? 'mobile-hidden' : ''}`}
        aria-label="随机 Coser 生成结果"
      >
        <div className="output-card">
          <h2>🎨 双引擎生成结果</h2>

          {!hasResults && !isGenerating && (
            <div className="output-placeholder">
              <p>点击「一键生成随机 Coser」开始体验双引擎对比生成~</p>
            </div>
          )}

          {hasResults && (
            <div className="coser-image-compare">
              {/* Fal 生成结果 */}
              <div className="coser-image-column">
                <h3 className="engine-label fal-label">🧠 Fal Seedream v4</h3>
                {falImage ? (
                  <figure className="seedream-image-card">
                    <img src={falImage.src} alt="Fal Seedream 生成的 Coser 写真" loading="lazy" />
                    <figcaption>
                      <button
                        type="button"
                        className="download-link"
                        onClick={() => downloadImage(falImage.src, falImage.downloadName)}
                      >
                        ⬇️ 下载 Fal 图片
                      </button>
                    </figcaption>
                  </figure>
                ) : (
                  <div className="coser-image-placeholder">
                    {falLoading ? (
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
                {qiniuImage ? (
                  <figure className="seedream-image-card">
                    <img src={qiniuImage.src} alt="七牛 Gemini 生成的 Coser 写真" loading="lazy" />
                    <figcaption>
                      <button
                        type="button"
                        className="download-link"
                        onClick={() => downloadImage(qiniuImage.src, qiniuImage.downloadName)}
                      >
                        ⬇️ 下载七牛图片
                      </button>
                    </figcaption>
                  </figure>
                ) : (
                  <div className="coser-image-placeholder">
                    {qiniuLoading ? (
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
  )
}

export default CoserPlayground
