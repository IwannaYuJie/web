import {
  errorResponse,
  handleArticleOptions,
  jsonResponse,
  nextArticleId,
  normalizeArticleInput,
  parseArticleRequest,
  readArticles,
  requireAdminKey,
  sortArticlesByDate,
  validateRequiredArticleFields,
  writeArticles,
} from '../_shared/articles.js'

/**
 * 获取所有文章列表
 */
async function getAllArticles(env) {
  try {
    return jsonResponse(sortArticlesByDate(await readArticles(env)))
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
    const article = (await readArticles(env)).find((item) => item.id === Number.parseInt(id, 10))

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
    const now = new Date().toISOString().split('T')[0]
    const normalizedData = normalizeArticleInput(articleData, now)
    const missingField = validateRequiredArticleFields(normalizedData)
    if (missingField) {
      return errorResponse(`缺少必填字段: ${missingField}`)
    }

    const articlesData = await readArticles(env)

    const newArticle = {
      id: nextArticleId(articlesData),
      ...normalizedData,
      createdAt: now,
      updatedAt: now,
    }

    articlesData.push(newArticle)
    await writeArticles(env, articlesData)

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
    const articlesData = await readArticles(env)
    const articleId = Number.parseInt(id, 10)
    const articleIndex = articlesData.findIndex((item) => item.id === articleId)

    if (articleIndex === -1) {
      return errorResponse('文章不存在', 404)
    }

    const now = new Date().toISOString().split('T')[0]
    const normalizedData = normalizeArticleInput({
      ...articlesData[articleIndex],
      ...articleData,
    }, articlesData[articleIndex].date || now)

    articlesData[articleIndex] = {
      ...normalizedData,
      id: articleId,
      createdAt: articlesData[articleIndex].createdAt || now,
      updatedAt: now,
    }

    await writeArticles(env, articlesData)

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
    const articlesData = await readArticles(env)
    const articleIndex = articlesData.findIndex((item) => item.id === Number.parseInt(id, 10))

    if (articleIndex === -1) {
      return errorResponse('文章不存在', 404)
    }

    const deletedArticle = articlesData.splice(articleIndex, 1)[0]
    await writeArticles(env, articlesData)

    return jsonResponse({
      message: '文章删除成功',
      deletedArticle,
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
  const { method, articleId } = parseArticleRequest(request)

  if (method === 'OPTIONS') {
    return handleArticleOptions()
  }

  // 检查 KV 绑定是否存在
  if (!env.ARTICLES_KV) {
    return errorResponse('KV 命名空间未配置，请在 Cloudflare Pages 设置中绑定 ARTICLES_KV', 500)
  }

  // 特殊处理：验证 Key 的请求
  if (articleId === 'auth-check' && method === 'POST') {
    const adminKey = env.ADMIN_KEY
    const requestKey = request.headers.get('X-Admin-Key')

    if (!adminKey) {
      return errorResponse('服务器未配置 ADMIN_KEY', 500)
    }

    if (requestKey === adminKey) {
      return jsonResponse({ status: 'ok', message: '验证通过' })
    } else {
      return errorResponse('密码错误', 401)
    }
  }

  // 权限验证 (仅针对写操作)
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    const authResult = requireAdminKey(request, env)
    if (!authResult.ok) {
      return authResult.response
    }
  }

  try {
    // 路由处理
    switch (method) {
      case 'GET':
        if (articleId) {
          return await getArticleById(env, articleId)
        }
        return await getAllArticles(env)

      case 'POST':
        if (articleId) {
          return errorResponse('POST 请求不应包含文章 ID，请使用 PUT 更新文章', 400)
        }
        const createData = await request.json()
        return await createArticle(env, createData)

      case 'PUT':
        if (!articleId) {
          return errorResponse('缺少文章 ID')
        }
        const updateData = await request.json()
        return await updateArticle(env, articleId, updateData)

      case 'DELETE':
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
