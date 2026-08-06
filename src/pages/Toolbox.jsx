import { Link } from 'react-router-dom'

const TOOLS = [
  {
    id: 'json-formatter',
    title: 'JSON 格式化',
    description: '校验 / 美化 / 压缩 JSON，复制就能用。',
    icon: '🧾',
    path: '/toolbox/json-formatter',
    tag: '常用',
    k: 'k1',
  },
  {
    id: 'timestamp',
    title: '时间戳转换',
    description: 'Unix 时间戳和日期互转，秒、毫秒、本地、UTC 都显示。',
    icon: '⏱️',
    path: '/toolbox/timestamp',
    tag: '常用',
    k: 'k3',
  },
  {
    id: 'base64',
    title: 'Base64 编解码',
    description: '文本和文件的 Base64 编解码，文件不会上传服务器。',
    icon: '🔐',
    path: '/toolbox/base64',
    tag: '常用',
    k: 'k2',
  },
  {
    id: 'color',
    title: '颜色转换',
    description: 'HEX / RGB / HSL 互转，附取色板和几个预设。',
    icon: '🎨',
    path: '/toolbox/color',
    tag: '设计',
    k: 'k1',
  },
  {
    id: 'text-counter',
    title: '文本统计',
    description: '数字符、字节、单词、CJK 字数、行数，估算阅读时间。',
    icon: '🔤',
    path: '/toolbox/text-counter',
    tag: '写作',
    k: 'k2',
  },
  {
    id: 'password',
    title: '密码生成',
    description: '用 Web Crypto 生成随机密码，长度和字符集都能调。',
    icon: '🔑',
    path: '/toolbox/password',
    tag: '安全',
    k: 'k3',
  },
  {
    id: 'sprite-sheet-to-gif',
    title: '精灵图转 GIF',
    description: '切分精灵图，按 FPS 合成 GIF，浏览器里跑完。',
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
      <PageHead emoji="" title="工具箱" sub="自己常用的小工具，跑在浏览器里，不上传任何东西" />

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
