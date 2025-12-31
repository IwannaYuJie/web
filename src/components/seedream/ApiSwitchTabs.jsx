// React 17+ JSX 自动导入

/**
 * API 切换标签组件
 */
function ApiSwitchTabs({ activeApi, onSwitch }) {
  return (
    <div className="api-switch" role="tablist" aria-label="图像生成 API 切换">
      <button
        type="button"
        className={`api-switch-button${activeApi === 'fal' ? ' active' : ''}`}
        onClick={() => onSwitch('fal')}
      >
        🧠 Fal.ai Seedream
      </button>
      <button
        type="button"
        className={`api-switch-button${activeApi === 'qiniu' ? ' active' : ''}`}
        onClick={() => onSwitch('qiniu')}
      >
        🐧 七牛 Gemini
      </button>
      <button
        type="button"
        className={`api-switch-button coser-button${activeApi === 'playground' ? ' active' : ''}`}
        onClick={() => onSwitch('playground')}
      >
        🎮 更多玩法
      </button>
    </div>
  )
}

export default ApiSwitchTabs
