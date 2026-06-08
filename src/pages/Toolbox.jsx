import { Link } from 'react-router-dom'

const TOOLS = [
  {
    id: 'json-formatter',
    title: 'JSON 格式化',
    description: '校验、美化、压缩 JSON。一眼看清结构，复制压缩版直接拿去用。',
    icon: '🧾',
    path: '/toolbox/json-formatter',
    tag: '高频',
    k: 'k1',
  },
  {
    id: 'timestamp',
    title: '时间戳转换',
    description: 'Unix 时间戳与日期时间互转，支持秒 / 毫秒，本地与 UTC 同时显示。',
    icon: '⏱️',
    path: '/toolbox/timestamp',
    tag: '常用',
    k: 'k3',
  },
  {
    id: 'base64',
    title: 'Base64 编解码',
    description: '文本与文件的 Base64 编解码，支持 URL-safe，文件不会上传。',
    icon: '🔐',
    path: '/toolbox/base64',
    tag: '常用',
    k: 'k2',
  },
  {
    id: 'color',
    title: '颜色转换',
    description: 'HEX、RGB、HSL 三种格式互转，附带取色板和常用预设。',
    icon: '🎨',
    path: '/toolbox/color',
    tag: '设计',
    k: 'k1',
  },
  {
    id: 'text-counter',
    title: '文本统计',
    description: '统计字符数、字节数、单词、中日韩字符、行数与预计阅读时长。',
    icon: '🔤',
    path: '/toolbox/text-counter',
    tag: '写作',
    k: 'k2',
  },
  {
    id: 'password',
    title: '密码生成',
    description: '基于 Web Crypto 的强随机密码生成，自定义长度和字符集。',
    icon: '🔑',
    path: '/toolbox/password',
    tag: '安全',
    k: 'k3',
  },
  {
    id: 'sprite-sheet-to-gif',
    title: '精灵图转 GIF',
    description: '把精灵图按行列切分，再按指定 FPS 合成为 GIF 动画，浏览器内一键完成。',
    icon: '🎞️',
    path: '/toolbox/sprite-sheet-to-gif',
    tag: '招牌',
    k: 'k4',
  },
]

function PageHead({ emoji, title, sub }) {
  return (
    <div style={{ padding: '34px 0 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 1, letterSpacing: '-.02em' }}>
        {emoji} {title}
      </h1>
      {sub && <p style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 12, fontWeight: 500 }}>{sub}</p>}
    </div>
  )
}

function Toolbox() {
  return (
    <div className="wrap" style={{ maxWidth: 1000, paddingBottom: 48 }}>
      <PageHead emoji="🧰" title="实用工具箱" sub="开发日常高频小工具，全部本地运行，不上传数据" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {TOOLS.map(t => (
          <Link
            to={t.path}
            key={t.id}
            className={`ec ${t.k}`}
            style={{ padding: 24, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 34 }}>{t.icon}</div>
              <span className="cat-chip" style={{ color: 'inherit' }}>{t.tag}</span>
            </div>
            <h3 style={{ fontSize: 21, margin: '12px 0 8px' }}>{t.title}</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-soft)', flex: 1 }}>
              {t.description}
            </p>
            <div className="arrow" style={{ marginTop: 12 }}>打开工具 →</div>
            <div className="paw">🐾</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Toolbox
