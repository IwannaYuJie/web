export const blogProfile = {
  name: '橘猫小窝',
  owner: '橘猫博主',
  role: '写 Java 多一些，最近在玩 AI',
  avatar: '/images/cat-avatar.png',
  location: 'China',
  email: 'hello@jumaomaomaoju.cn',
  github: 'https://github.com/IwannaYuJie',
  site: 'https://jumaomaomaoju.cn',
  intro:
    '随手记的技术笔记。后端、AI、自己折腾的小项目都丢在这。主要是写给半年后的自己看的。',
  manifesto: [
    '能在本地复现一遍才算真的搞懂',
    '写明白点，过段时间自己还能看得懂',
    '尽量把反例和当时没选的方案也留下来',
  ],
}

export const nowItems = [
  {
    title: '最近在玩',
    value: 'Java 25、几个 AI 工具，还有这个博客本身',
  },
  {
    title: '更新节奏',
    value: '想到再写，所以更得很慢',
  },
  {
    title: '怎么写',
    value: '凭做完的项目复盘，能补反例就补',
  },
]

export const blogProjects = [
  {
    title: 'AI 创意工作室',
    description: '随手搭的几个 AI 小工具，图像生成、提示词调试这类。',
    href: '/secret-chat',
    status: '隐藏路径',
  },
  {
    title: '实用工具箱',
    description: '自己常用的小工具：JSON、时间戳、Base64、精灵图转 GIF 这些。',
    href: '/toolbox',
    status: '常用',
  },
  {
    title: '小游戏中心',
    description: '练手做的几款小游戏，纯前端，点开就能玩。',
    href: '/games',
    status: '休息区',
  },
]

export const blogMilestones = [
  {
    date: '2026-05',
    title: '博客大改版',
    description: '重写了首页、归档、标签、关于这几页。',
  },
  {
    date: '2026-03',
    title: '把加载拆开了',
    description: '文章、游戏、Markdown 渲染改成按需加载，首屏轻一些。',
  },
  {
    date: '2025-11',
    title: '加了 AI 图像页',
    description: '图像生成和提示词调试丢在隐藏路径下。',
  },
]

export const contactLinks = [
  { label: 'GitHub', href: blogProfile.github },
  { label: '站点首页', href: blogProfile.site },
  { label: '邮件', href: `mailto:${blogProfile.email}` },
]
