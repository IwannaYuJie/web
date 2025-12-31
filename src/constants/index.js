/**
 * 应用常量配置
 * 将静态数据提取到组件外部，避免重复创建
 */

// 文章分类
export const ARTICLE_CATEGORIES = [
  '全部', 'Java核心', 'Spring框架', '微服务', '数据库',
  'JVM', '中间件', '云原生', '架构设计', '搜索引擎', '持久层'
]

// 编程智慧语录
export const CAT_QUOTES = [
  { text: '代码如诗，简洁优雅才是最高境界', author: 'Martin Fowler' },
  { text: '过早的优化是万恶之源', author: 'Donald Knuth' },
  { text: '任何傻瓜都能写出计算机能理解的代码，但只有好的程序员才能写出人类能理解的代码', author: 'Kent Beck' },
  { text: '简单是可靠的先决条件', author: 'Edsger W. Dijkstra' },
  { text: '完成比完美更重要', author: 'Facebook工程师文化' }
]

// 网页模板数据
export const WEB_TEMPLATES = [
  { id: 1, title: '极简博客', desc: '专注于阅读体验的纯净博客模板', icon: '📝', link: '#' },
  { id: 2, title: '创意作品集', desc: '适合设计师的视觉系展示模板', icon: '🎨', link: '#' },
  { id: 3, title: '文档中心', desc: '清晰的文档与知识库管理模板', icon: '📚', link: '#' },
  { id: 4, title: '营销落地页', desc: '高转化率的产品推广落地页', icon: '🚀', link: '#' }
]

// 橘猫心情表情
export const CAT_MOODS = ['😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

// 图片尺寸预设
export const SIZE_PRESETS = {
  auto_4K: { label: '自动 4K', value: 'auto_4K' },
  square: { label: '正方形', value: 'square' },
  landscape: { label: '横向', value: 'landscape_4_3' },
  portrait: { label: '纵向', value: 'portrait_3_4' },
  custom: { label: '自定义', value: 'custom' }
}

// 宽高比选项
export const ASPECT_RATIO_OPTIONS = [
  { label: '1:1 (正方形)', value: '1:1' },
  { label: '4:3 (标准)', value: '4:3' },
  { label: '3:4 (竖版)', value: '3:4' },
  { label: '16:9 (宽屏)', value: '16:9' },
  { label: '9:16 (竖屏)', value: '9:16' }
]

// 分辨率选项
export const RESOLUTION_OPTIONS = [
  { label: '1K (1024px)', value: '1K' },
  { label: '2K (2048px)', value: '2K' },
  { label: '4K (4096px)', value: '4K' }
]

// 输出格式选项
export const OUTPUT_FORMAT_OPTIONS = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' }
]

// API 存储键
export const STORAGE_KEYS = {
  FAL_API_KEY: 'seedream-fal-key',
  IMAGE_HISTORY: 'imageHistory'
}
