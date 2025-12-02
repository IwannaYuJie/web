/**
 * Cloudflare Pages Functions - 随机 Coser 提示词生成 API
 * 通过七牛文本对话 API 生成随机中国年轻女生 Coser 写真提示词
 * 
 * 文件路径：functions/api/coser-random.js
 * 访问路径：/api/coser-random
 */

export async function onRequest(context) {
  const { request } = context

  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // 使用七牛生图的 API Key（与生图共用）
    const API_KEY = context.env.QINIU_AI_API_KEY
    
    // 安全检查：必须配置环境变量
    if (!API_KEY) {
      return new Response(JSON.stringify({ 
        error: '服务器配置错误', 
        message: '未配置 QINIU_AI_API_KEY 环境变量，请在 Cloudflare Dashboard 中添加' 
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // 解析请求体获取用户输入
    let userInput = ''
    try {
      const body = await request.json()
      userInput = body?.userInput?.trim() || ''
    } catch (parseError) {
      // 忽略解析错误，使用空字符串
    }

    // 根据是否有用户输入构建不同的系统提示词
    const baseRequirements = `你是一个专业的 AI 绘画提示词生成器。你的任务是生成一个符合东亚主流审美的中国年轻女生详细英文写真提示词。

要求：
1. 主体必须是极具吸引力的中国年轻女生（18-24岁），面容精致，皮肤白皙光滑，妆容完美。强调"网红感"、"偶像感"或"初恋感"，符合国人对美女的普遍审美。
2. 必须在提示词开头包含高质量修饰词：(masterpiece, best quality, highres), perfect face, delicate features, smooth skin, pale skin, beautiful eyes, k-pop idol aesthetic。
3. 避免生成过于写实导致的皮肤瑕疵、暗沉或粗糙感。光影要柔和、明亮、梦幻，避免阴暗或过于强烈的对比。
4. 服装风格随机多样（可以是 Cosplay、日常穿搭、汉服、JK制服、洛丽塔、礼服、运动装、赛博朋克风格等）。
5. 场景随机多样，但要保持画面干净唯美（可以是自然风景、城市街头、室内影棚、校园、咖啡厅、幻想场景等）。
6. 如果用户提供了特定的关键词（如"巨乳"、"黑丝"、"海边"等），请在提示词中显著增加这些元素的比重和细节描述，确保画面体现用户的核心需求。
7. 输出纯英文提示词，适合 AI 绘画模型使用。
8. 不要输出任何解释，只输出提示词本身。
9. 提示词长度控制在 100-200 词之间。

示例输出格式：
(Masterpiece, best quality), A stunningly beautiful young Chinese girl, perfect face, smooth pale skin, delicate makeup, wearing [服装描述], [发型发色], [姿势/动作], [场景], [光线/氛围], [拍摄风格], professional photography, 8k, ultra detailed, soft lighting, bokeh background`

    // 构建用户消息
    let userMessage = '请生成一个随机的中国年轻女生写真提示词，包含随机的服装、场景和拍摄风格。'
    if (userInput) {
      userMessage = `请生成一个中国年轻女生写真提示词，重点满足以下用户需求：${userInput}。请确保在提示词中强调这些元素，并围绕这些元素构建画面。`
    }

    // 调用七牛文本对话 API 生成随机提示词
    const response = await fetch('https://api.qnaigc.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-3.0-pro-preview',
        messages: [
          { role: 'system', content: baseRequirements },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 512,
        temperature: 1.2  // 较高的温度以增加随机性
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || `API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    // 提取生成的提示词
    const generatedPrompt = data?.choices?.[0]?.message?.content?.trim()
    
    if (!generatedPrompt) {
      throw new Error('未能生成有效的提示词')
    }

    // 返回生成的提示词
    return new Response(JSON.stringify({ 
      success: true,
      prompt: generatedPrompt,
      usage: data?.usage
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('随机 Coser 提示词生成错误:', error)
    return new Response(JSON.stringify({ 
      error: '生成失败', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}
