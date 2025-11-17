/**
 * Cloudflare Pages Function - 初始化文章数据
 * 用于将默认文章数据导入到 KV 存储中
 * 
 * 访问 /api/init-articles 即可初始化数据
 * 注意：此接口会覆盖现有数据，请谨慎使用！
 */

// CORS 响应头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
}

// 默认文章数据
// 注意：所有测试示例文章已清空，请通过文章管理页面添加实际文章内容
const defaultArticles = []

/**
 * 主处理函数
 */
export async function onRequest(context) {
  const { request, env } = context
  const method = request.method
  
  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  // 只允许 POST 请求
  if (method !== 'POST' && method !== 'GET') {
    return new Response(JSON.stringify({ error: '只支持 GET 或 POST 请求' }), {
      status: 405,
      headers: corsHeaders
    })
  }
  
  // 检查 KV 绑定是否存在
  if (!env.ARTICLES_KV) {
    return new Response(JSON.stringify({ 
      error: 'KV 命名空间未配置',
      message: '请在 Cloudflare Pages 设置中绑定 ARTICLES_KV'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
  
  try {
    // 检查是否已有数据
    const existingData = await env.ARTICLES_KV.get('articles_list', { type: 'json' })
    
    if (existingData && existingData.length > 0 && method === 'GET') {
      return new Response(JSON.stringify({
        message: '数据已存在',
        count: existingData.length,
        articles: existingData,
        tip: '如需重新初始化，请使用 POST 请求'
      }), {
        status: 200,
        headers: corsHeaders
      })
    }
    
    // 写入默认数据到 KV
    await env.ARTICLES_KV.put('articles_list', JSON.stringify(defaultArticles))
    
    return new Response(JSON.stringify({
      success: true,
      message: '文章数据初始化成功！',
      count: defaultArticles.length,
      articles: defaultArticles
    }), {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('初始化失败:', error)
    return new Response(JSON.stringify({
      error: '初始化失败',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
}
