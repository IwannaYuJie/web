import { articleCorsHeaders, ARTICLES_LIST_KEY, errorResponse, jsonResponse } from '../_shared/articles.js'

// 默认文章数据
// 注意：所有测试示例文章已清空，请通过文章管理页面添加实际文章内容
const defaultArticles = []

/**
 * 主处理函数
 */
export async function onRequest(context) {
  const { request, env } = context
  const method = request.method
  
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: articleCorsHeaders
    })
  }
  
  if (method !== 'POST' && method !== 'GET') {
    return errorResponse('只支持 GET 或 POST 请求', 405, articleCorsHeaders)
  }
  
  if (!env.ARTICLES_KV) {
    return jsonResponse({ 
      error: 'KV 命名空间未配置',
      message: '请在 Cloudflare Pages 设置中绑定 ARTICLES_KV'
    }, 500, articleCorsHeaders)
  }
  
  try {
    const existingData = await env.ARTICLES_KV.get(ARTICLES_LIST_KEY, { type: 'json' })
    
    if (existingData && existingData.length > 0 && method === 'GET') {
      return jsonResponse({
        message: '数据已存在',
        count: existingData.length,
        articles: existingData,
        tip: '如需重新初始化，请使用 POST 请求'
      }, 200, articleCorsHeaders)
    }
    
    await env.ARTICLES_KV.put(ARTICLES_LIST_KEY, JSON.stringify(defaultArticles))
    
    return jsonResponse({
      success: true,
      message: '文章数据初始化成功！',
      count: defaultArticles.length,
      articles: defaultArticles
    }, 200, articleCorsHeaders)
  } catch (error) {
    console.error('初始化失败:', error)
    return jsonResponse({
      error: '初始化失败',
      message: error.message
    }, 500, articleCorsHeaders)
  }
}
