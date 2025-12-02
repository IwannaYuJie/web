/**
 * Vercel Serverless Function - 随机 Coser 提示词生成 API
 * 通过七牛文本对话 API 生成随机中国年轻女生 Coser 写真提示词
 * 
 * 文件路径：api/coser-random.js
 * 访问路径：/api/coser-random
 */

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 使用七牛生图的 API Key（与生图共用）
    const API_KEY = process.env.QINIU_AI_API_KEY
    
    // 安全检查：必须配置环境变量
    if (!API_KEY) {
      return res.status(500).json({ 
        error: '服务器配置错误', 
        message: '未配置 QINIU_AI_API_KEY 环境变量' 
      })
    }

    // 系统提示词：用于生成随机 Coser 写真描述
    const systemPrompt = `你是一个专业的 AI 绘画提示词生成器。你的任务是生成一个中国年轻女生 Coser 写真的详细英文提示词。

要求：
1. 随机选择一个知名动漫/游戏角色进行 Cosplay（如原神、崩坏、王者荣耀、明日方舟、鬼灭之刃等）
2. 描述角色的服装特点、发型发色、妆容
3. 随机选择一个自然或室内场景
4. 随机选择一个优美的动作或姿势
5. 添加摄影相关描述（光线、构图、镜头效果等）
6. 输出纯英文提示词，适合 AI 绘画模型使用
7. 不要输出任何解释，只输出提示词本身
8. 提示词长度控制在 100-200 词之间

示例输出格式：
A beautiful young Chinese girl cosplaying as [角色名] from [作品名], wearing [服装描述], [发型发色], [妆容], [姿势/动作], [场景], [光线/氛围], professional photography, 8k, ultra detailed, soft lighting, bokeh background`

    // 调用七牛文本对话 API 生成随机提示词
    const response = await fetch('https://api.qnaigc.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请生成一个随机的中国年轻女生 Coser 写真提示词。' }
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
    return res.status(200).json({ 
      success: true,
      prompt: generatedPrompt,
      usage: data?.usage
    })

  } catch (error) {
    console.error('随机 Coser 提示词生成错误:', error)
    return res.status(500).json({ 
      error: '生成失败', 
      message: error.message 
    })
  }
}
