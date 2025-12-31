// React 17+ JSX 自动导入

/**
 * 模型选择面板组件
 */
function ModelSelector({ modelType, setModelType }) {
  return (
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
          <option value="v4.5">Seedream v4.5 (最新)</option>
          <option value="new">Gemini 3 Pro (新版)</option>
          <option value="z-image-turbo">Z-Image Turbo (6B 超快速)</option>
        </select>
      </div>
    </div>
  )
}

export default ModelSelector
