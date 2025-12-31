// React 17+ JSX 自动导入

/**
 * 提示词输入组件
 * 包含生成随机提示词和优化提示词功能
 */
function PromptInput({
  prompt,
  setPrompt,
  onGenerateRandom,
  onOptimize,
  randomLoading,
  optimizeLoading,
  disabled
}) {
  return (
    <div className="panel-card">
      <h2>✨ 创意描述</h2>
      <div className="field-group">
        <div className="field-label-row">
          <label htmlFor="prompt-input">Prompt（提示词）</label>
          <div className="prompt-actions">
            <button
              type="button"
              className="prompt-action-button"
              onClick={onGenerateRandom}
              disabled={randomLoading || disabled}
              title="随机生成一个创意提示词"
            >
              {randomLoading ? '⏳' : '🎲'}
            </button>
            <button
              type="button"
              className="prompt-action-button"
              onClick={onOptimize}
              disabled={optimizeLoading || disabled || !prompt?.trim()}
              title="优化当前提示词"
            >
              {optimizeLoading ? '⏳' : '✨'}
            </button>
          </div>
        </div>
        <textarea
          id="prompt-input"
          rows={4}
          placeholder="描述你想生成的图像，例如：一只橘猫在阳光下懒洋洋地晒太阳..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
        />
        <p className="panel-tip">
          🎲 随机生成创意 | ✨ 优化当前描述
        </p>
      </div>
    </div>
  )
}

export default PromptInput
