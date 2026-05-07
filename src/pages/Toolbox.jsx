import { Link } from 'react-router-dom'

const TOOLS = [
  {
    id: 'json-formatter',
    title: 'JSON 格式化',
    description: '校验、美化、压缩 JSON。一眼看清结构，复制压缩版直接拿去用。',
    icon: '🧾',
    path: '/toolbox/json-formatter',
    isNew: true,
  },
  {
    id: 'timestamp',
    title: '时间戳转换',
    description: 'Unix 时间戳与日期时间互转，支持秒 / 毫秒，本地与 UTC 同时显示。',
    icon: '⏱️',
    path: '/toolbox/timestamp',
    isNew: true,
  },
  {
    id: 'base64',
    title: 'Base64 编解码',
    description: '文本与文件的 Base64 编解码，支持 URL-safe，文件不会上传。',
    icon: '🔐',
    path: '/toolbox/base64',
    isNew: true,
  },
  {
    id: 'color',
    title: '颜色转换',
    description: 'HEX、RGB、HSL 三种格式互转，附带取色板和常用预设。',
    icon: '🎨',
    path: '/toolbox/color',
    isNew: true,
  },
  {
    id: 'text-counter',
    title: '文本统计',
    description: '统计字符数、字节数、单词、中日韩字符、行数与预计阅读时长。',
    icon: '🔤',
    path: '/toolbox/text-counter',
    isNew: true,
  },
  {
    id: 'password',
    title: '密码生成',
    description: '基于 Web Crypto 的强随机密码生成，自定义长度和字符集。',
    icon: '🔑',
    path: '/toolbox/password',
    isNew: true,
  },
  {
    id: 'sprite-sheet-to-gif',
    title: '精灵图转 GIF',
    description: '把精灵图（Sprite Sheet）按行列切分，再按指定 FPS 合成为 GIF 动画，浏览器内一键完成。',
    icon: '🎞️',
    path: '/toolbox/sprite-sheet-to-gif',
  },
]

function Toolbox() {
  return (
    <div className="container pb-12 animate-fade-in">
      <section className="glass rounded-[32px] p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="relative z-10 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full mb-4 text-primary font-bold text-sm backdrop-blur-sm">
            <span>🧰</span>
            <span>橘猫工具箱</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient leading-tight">
            趁手的小工具
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            一些写起来有点意思、用起来又能省时间的浏览器小工具。
            <br />都跑在你的浏览器里，不上传任何东西。
          </p>
        </div>

        <div className="relative z-10 text-7xl md:text-8xl select-none" aria-hidden="true">
          🐱
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </section>

      <div className="glass p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
          <span>✨</span> 全部工具
          <span className="ml-auto text-sm font-medium text-text-secondary">
            共 <strong className="text-primary">{TOOLS.length}</strong> 个工具
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => (
            <Link
              to={tool.path}
              key={tool.id}
              className="group relative card card-hover block overflow-hidden"
            >
              {tool.isNew && (
                <span className="absolute top-3 right-3 bg-gradient-to-r from-primary to-primary-hover text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  NEW
                </span>
              )}

              <div className="text-3xl bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/15 transition-transform">
                {tool.icon}
              </div>

              <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {tool.description}
              </p>

              <div className="text-sm text-primary font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                <span>打开工具</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Toolbox
