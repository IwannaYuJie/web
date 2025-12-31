// React 17+ JSX 自动导入

/**
 * API Key 设置面板组件
 */
function ApiKeyPanel({
  apiKey,
  setApiKey,
  saveMessage,
  onSave,
  onClear,
  isOpen,
  onToggle
}) {
  return (
    <div className="panel-card collapsible">
      <button
        type="button"
        className="collapse-header"
        onClick={onToggle}
      >
        <h2>🔑 Fal.ai API Key</h2>
        <span className="collapse-icon">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
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
            <button type="button" className="primary" onClick={onSave}>
              🐾 保存到本地
            </button>
            <button type="button" className="ghost" onClick={onClear}>
              🧼 清除保存
            </button>
          </div>
          {saveMessage && <p className="panel-message">{saveMessage}</p>}
        </div>
      )}
    </div>
  )
}

export default ApiKeyPanel
