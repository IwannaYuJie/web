export const blogProfile = {
  name: '橘猫小窝',
  owner: '橘猫博主',
  role: 'Java 后端 / AI 工具 / 个人项目记录者',
  avatar: '/images/cat-avatar.png',
  location: 'China',
  email: 'hello@jumaomaomaoju.cn',
  github: 'https://github.com/IwannaYuJie',
  site: 'https://jumaomaomaoju.cn',
  intro:
    '这里记录工程实践、AI 工具折腾、个人项目和一点点生活灵感。文章不追求热闹，优先把踩坑、判断和复盘写清楚。',
  manifesto: [
    '把复杂问题拆到可以复现',
    '写给未来的自己，也写给正在查资料的人',
    '项目和文章都尽量留证据、留结论、留下一步',
  ],
}

export const nowItems = [
  {
    title: '近期主题',
    value: 'Java 版本升级、AI 工具链、个人博客产品化',
  },
  {
    title: '写作状态',
    value: '偏长文复盘，先讲结论，再补证据和取舍',
  },
  {
    title: '维护原则',
    value: '功能、文档、验证记录一起更新',
  },
]

export const blogProjects = [
  {
    title: 'AI 创意工作室',
    description: '围绕图像生成、提示词优化和模型对比做的小工具集合。',
    href: '/secret-chat',
    status: '隐藏实验',
  },
  {
    title: '实用工具箱',
    description: '整理日常高频使用的小工具，比如 JSON、Base64、时间戳和精灵图转换。',
    href: '/toolbox',
    status: '常用',
  },
  {
    title: '小游戏中心',
    description: '把前端交互、状态管理和小玩法做成可直接体验的合集。',
    href: '/games',
    status: '休息区',
  },
]

export const blogMilestones = [
  {
    date: '2026-05',
    title: '个人博客完全体改造',
    description: '补齐首页信息架构、归档、标签、关于页和文章串联能力。',
  },
  {
    date: '2026-03',
    title: '文章链路性能优化',
    description: '文章、游戏和 Markdown 渲染拆分加载，降低首屏负担。',
  },
  {
    date: '2025-11',
    title: 'AI 图像实验能力上线',
    description: '接入图像生成、编辑和提示词优化实验页。',
  },
]

export const contactLinks = [
  { label: 'GitHub', href: blogProfile.github },
  { label: '站点首页', href: blogProfile.site },
  { label: '邮件', href: `mailto:${blogProfile.email}` },
]
