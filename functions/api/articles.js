/**
 * Cloudflare Pages Function - 文章管理 API
 * 提供文章的增删改查功能，数据存储在 Cloudflare KV 中
 * 
 * KV 命名空间绑定名称: ARTICLES_KV
 * 
 * API 端点:
 * - GET /api/articles - 获取所有文章列表
 * - GET /api/articles/:id - 获取单篇文章详情
 * - POST /api/articles - 创建新文章
 * - PUT /api/articles/:id - 更新文章
 * - DELETE /api/articles/:id - 删除文章
 */

// CORS 响应头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
}

/**
 * 处理 OPTIONS 预检请求
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  })
}

/**
 * 返回成功响应
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  })
}

/**
 * 返回错误响应
 */
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status)
}

/**
 * 获取所有文章列表
 */
async function getAllArticles(env) {
  try {
    // 从 KV 中获取文章列表
    const articlesData = await env.ARTICLES_KV.get('articles_list', { type: 'json' })
    
    if (!articlesData || !Array.isArray(articlesData)) {
      // 如果没有数据，返回空数组
      return jsonResponse([])
    }
    
    // 按日期降序排序
    const sortedArticles = articlesData.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
    
    return jsonResponse(sortedArticles)
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return errorResponse('获取文章列表失败', 500)
  }
}

/**
 * 获取单篇文章详情
 */
async function getArticleById(env, id) {
  try {
    const articlesData = await env.ARTICLES_KV.get('articles_list', { type: 'json' })
    
    if (!articlesData || !Array.isArray(articlesData)) {
      return errorResponse('文章不存在', 404)
    }
    
    const article = articlesData.find(a => a.id === parseInt(id))
    
    if (!article) {
      return errorResponse('文章不存在', 404)
    }
    
    return jsonResponse(article)
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return errorResponse('获取文章详情失败', 500)
  }
}

/**
 * 创建新文章
 */
async function createArticle(env, articleData) {
  try {
    // 验证必填字段
    const requiredFields = ['title', 'description', 'category', 'readTime']
    for (const field of requiredFields) {
      if (!articleData[field]) {
        return errorResponse(`缺少必填字段: ${field}`)
      }
    }
    
    // 获取现有文章列表
    let articlesData = await env.ARTICLES_KV.get('articles_list', { type: 'json' }) || []
    
    // 生成新的文章 ID（取最大 ID + 1）
    const maxId = articlesData.length > 0 
      ? Math.max(...articlesData.map(a => a.id)) 
      : 0
    
    const newArticle = {
      id: maxId + 1,
      title: articleData.title,
      description: articleData.description,
      date: articleData.date || new Date().toISOString().split('T')[0], // 默认今天
      category: articleData.category,
      readTime: articleData.readTime,
      content: articleData.content || '' // 文章内容（可选）
    }
    
    // 添加到列表
    articlesData.push(newArticle)
    
    // 保存到 KV
    await env.ARTICLES_KV.put('articles_list', JSON.stringify(articlesData))
    
    return jsonResponse(newArticle, 201)
  } catch (error) {
    console.error('创建文章失败:', error)
    return errorResponse('创建文章失败', 500)
  }
}

/**
 * 更新文章
 */
async function updateArticle(env, id, articleData) {
  try {
    // 获取现有文章列表
    let articlesData = await env.ARTICLES_KV.get('articles_list', { type: 'json' })
    
    if (!articlesData || !Array.isArray(articlesData)) {
      return errorResponse('文章不存在', 404)
    }
    
    const articleIndex = articlesData.findIndex(a => a.id === parseInt(id))
    
    if (articleIndex === -1) {
      return errorResponse('文章不存在', 404)
    }
    
    // 更新文章数据（保留 ID）
    articlesData[articleIndex] = {
      ...articlesData[articleIndex],
      ...articleData,
      id: parseInt(id) // 确保 ID 不变
    }
    
    // 保存到 KV
    await env.ARTICLES_KV.put('articles_list', JSON.stringify(articlesData))
    
    return jsonResponse(articlesData[articleIndex])
  } catch (error) {
    console.error('更新文章失败:', error)
    return errorResponse('更新文章失败', 500)
  }
}

/**
 * 删除文章
 */
async function deleteArticle(env, id) {
  try {
    // 获取现有文章列表
    let articlesData = await env.ARTICLES_KV.get('articles_list', { type: 'json' })
    
    if (!articlesData || !Array.isArray(articlesData)) {
      return errorResponse('文章不存在', 404)
    }
    
    const articleIndex = articlesData.findIndex(a => a.id === parseInt(id))
    
    if (articleIndex === -1) {
      return errorResponse('文章不存在', 404)
    }
    
    // 删除文章
    const deletedArticle = articlesData.splice(articleIndex, 1)[0]
    
    // 保存到 KV
    await env.ARTICLES_KV.put('articles_list', JSON.stringify(articlesData))
    
    return jsonResponse({ 
      message: '文章删除成功', 
      deletedArticle 
    })
  } catch (error) {
    console.error('删除文章失败:', error)
    return errorResponse('删除文章失败', 500)
  }
}

/**
 * 主处理函数
 */
export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  let method = request.method
  
  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return handleOptions()
  }
  
  // 解析路径参数（例如 /api/articles/123）
  const pathParts = url.pathname.split('/').filter(p => p)
  const articleId = pathParts[2] // articles 后面的 ID
  
  // 支持 X-HTTP-Method-Override 头（用于绕过不支持 PUT/DELETE 的代理）
  const methodOverride = request.headers.get('X-HTTP-Method-Override')
  if (method === 'POST' && methodOverride) {
    method = methodOverride.toUpperCase()
    console.log(`[Method Override] 原始方法: POST, Override: ${methodOverride}, 最终方法: ${method}`)
  }
  
  console.log(`[API Request] ${method} ${url.pathname}, ArticleID: ${articleId || 'none'}`)
  
  // 检查 KV 绑定是否存在
  if (!env.ARTICLES_KV) {
    return errorResponse('KV 命名空间未配置，请在 Cloudflare Pages 设置中绑定 ARTICLES_KV', 500)
  }
  
  try {
    // 路由处理
    switch (method) {
      case 'GET':
        if (articleId) {
          // GET /api/articles/:id - 获取单篇文章
          return await getArticleById(env, articleId)
        } else {
          // GET /api/articles - 获取所有文章
          return await getAllArticles(env)
        }
      
      case 'POST':
        // POST /api/articles - 创建新文章（仅当没有 articleId 时）
        if (articleId) {
          return errorResponse('POST 请求不应包含文章 ID，请使用 PUT 更新文章', 400)
        }
        const createData = await request.json()
        return await createArticle(env, createData)
      
      case 'PUT':
        // PUT /api/articles/:id - 更新文章
        if (!articleId) {
          return errorResponse('缺少文章 ID')
        }
        const updateData = await request.json()
        return await updateArticle(env, articleId, updateData)
      
      case 'DELETE':
        // DELETE /api/articles/:id - 删除文章
        if (!articleId) {
          return errorResponse('缺少文章 ID')
        }
        return await deleteArticle(env, articleId)
      
      default:
        return errorResponse('不支持的请求方法', 405)
    }
  } catch (error) {
    console.error('请求处理失败:', error)
    return errorResponse('服务器内部错误', 500)
  }
}
