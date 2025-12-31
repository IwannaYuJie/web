// React 17+ JSX 自动导入

/**
 * 生成模式切换组件（文生图/图生图）
 */
function ModeSwitch({ mode, onModeChange }) {
  return (
    <div className="panel-card">
      <h2>🎯 生成模式</h2>
      <div className="mode-switch">
        <button
          type="button"
          className={`mode-button${mode === 'text' ? ' active' : ''}`}
          onClick={() => onModeChange('text')}
        >
          📝 文生图
        </button>
        <button
          type="button"
          className={`mode-button${mode === 'edit' ? ' active' : ''}`}
          onClick={() => onModeChange('edit')}
        >
          🖼️ 图生图
        </button>
      </div>
    </div>
  )
}

export default ModeSwitch
