import { GAMES } from '../data/games'
import { TOOLS } from '../data/tools'

const SITE_NAME = '橘猫小窝'
const DEFAULT_TITLE = '橘猫小窝 · 云深不知处'
const DEFAULT_DESCRIPTION = '橘猫小窝：随手记的技术笔记。Java、AI、自己折腾的小项目都丢在这，想到再写，更得很慢。'

function upsertMeta(attrName, attrValue, content) {
  if (typeof document === 'undefined' || !document.head) {
    return
  }
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function setDocumentMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  type = 'website',
  url,
} = {}) {
  if (typeof document === 'undefined') {
    return
  }
  const safeTitle = title || DEFAULT_TITLE
  const safeDesc = description || DEFAULT_DESCRIPTION
  const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  document.title = safeTitle
  upsertMeta('name', 'description', safeDesc)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:title', safeTitle)
  upsertMeta('property', 'og:description', safeDesc)
  upsertMeta('name', 'twitter:title', safeTitle)
  upsertMeta('name', 'twitter:description', safeDesc)
  if (resolvedUrl) {
    upsertMeta('property', 'og:url', resolvedUrl)
  }
}

export function resolveRouteMeta(pathname = '/', search = '') {
  const params = new URLSearchParams(search)

  if (pathname === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    }
  }
  if (pathname === '/archive') {
    return {
      title: `藏经阁 · 文章归档 | ${SITE_NAME}`,
      description: '按年份与门类翻检橘猫小窝的全部技术笔记与旧卷。',
    }
  }
  if (pathname === '/tags') {
    const tag = params.get('tag')
    return {
      title: tag ? `「${tag}」· 万象 | ${SITE_NAME}` : `万象 · 标签与门类 | ${SITE_NAME}`,
      description: tag
        ? `浏览橘猫小窝标签「${tag}」下的相关文章与笔记。`
        : '按签引星图与门类脉络探索橘猫小窝的全部技术文章。',
    }
  }
  if (pathname === '/creative') {
    return {
      title: `百工坊 · 创意工坊 | ${SITE_NAME}`,
      description: '多种独立排版流派与创意博客试验场，每一款皆可独立试玩。',
    }
  }
  if (pathname === '/games') {
    return {
      title: `游仙境 · 小游戏 | ${SITE_NAME}`,
      description: '橘猫小窝单机小游戏合集：纯前端运行，点开即玩。',
    }
  }
  if (pathname.startsWith('/games/')) {
    const slug = pathname.replace(/^\/games\//, '')
    const matched = GAMES.find((g) => g.id === slug || (slug === 'yujie' && g.id === 'yujie-game'))
    if (matched) {
      return {
        title: `${matched.name} · 游仙境 | ${SITE_NAME}`,
        description: matched.description,
      }
    }
    return {
      title: `游仙境 · 小游戏 | ${SITE_NAME}`,
      description: '橘猫小窝单机小游戏合集：纯前端运行，点开即玩。',
    }
  }
  if (pathname === '/toolbox') {
    return {
      title: `法宝阁 · 工具箱 | ${SITE_NAME}`,
      description: '纯浏览器本地运行的常用开发与写作小工具集合。',
    }
  }
  if (pathname.startsWith('/toolbox/')) {
    const tool = TOOLS.find((t) => t.path === pathname)
    if (tool) {
      return {
        title: `${tool.alias}（${tool.title}）· 法宝阁 | ${SITE_NAME}`,
        description: tool.description,
      }
    }
  }
  if (pathname === '/about') {
    return {
      title: `洞府 · 关于 | ${SITE_NAME}`,
      description: '关于橘猫小窝、近况与个人技术折腾纪事。',
    }
  }
  if (pathname === '/admin/articles') {
    return {
      title: `执笔 · 文章管理 | ${SITE_NAME}`,
      description: '橘猫小窝文章与资讯草稿管理台。',
    }
  }
  if (pathname.startsWith('/article/')) {
    return {
      title: `展卷阅读 | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      type: 'article',
    }
  }

  return {
    title: `迷途 · 云深不知处 (404) | ${SITE_NAME}`,
    description: '云深雾重，此路径下未见卷轴，请返回山门或使用全站寻踪。',
  }
}
