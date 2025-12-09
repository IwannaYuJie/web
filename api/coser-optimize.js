/**
 * Vercel Serverless Function - 提示词优化 API
 * 基于七牛文本对话 API 对用户输入的提示词进行深度扩写，仅围绕原始意图展开。
 * 访问路径：/api/coser-optimize
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const API_KEY = process.env.QINIU_AI_API_KEY

    if (!API_KEY) {
      return res.status(500).json({ error: '服务器配置错误', message: '未配置 QINIU_AI_API_KEY 环境变量' })
    }

    const userInput = req.body?.userInput?.trim() || ''
    if (!userInput) {
      return res.status(400).json({ error: '缺少提示词', message: '请提供待优化的提示词内容' })
    }

    const systemPrompt = `你是一个专注于「提示词精炼与深描」的助手。读取用户给出的原始提示词（可能是中文或英文），在不改变核心意图的前提下，生成一条更丰富、更细节化的英文绘画提示词。
  规则：
  1. 只围绕用户输入的主题、角色、姿态、动作、身体部位、服装、场景、道具展开，禁止加入用户未提及的新题材、世界观或无关物品。
  2. 动作/体位：细化姿势、肢体张力、镜头角度、景深、构图、表情、互动关系与环境呼应。
  3. 身体部位：若输入涉及胸部/臀部/腿/嘴唇/手/脚/腹肌等，补充该部位的形态、尺寸、皮肤质感、褶皱、衣物压痕、受力状态、触感，避免跳题到无关部位。
  4. 服装/饰品：补充材质、版型、透视程度、褶皱、扣件、配饰（眼镜、首饰、丝带、发夹等）并确保与原需求一致。
  5. 场景/氛围：细化地点、光影、时间、天气、色调、背景层次（前景/中景/远景）、情绪氛围，且必须与用户原始语义相关。
  6. 摄影/绘画参数：可补充镜头焦段、景深、光圈感受、布光位置、颗粒/质感、分辨率、风格标签（如写实/赛博/油画/摄影），前提是与原需求不冲突。
  7. 输出必须为英文 Stable Diffusion/Seedream 兼容提示词，开头包含品质标签：(masterpiece, best quality, highres, ultra detailed)。
  8. 长度控制在 120-220 个英文单词，使用逗号分隔短语；不要输出中文、解释或前后缀说明。
  9. 保留用户原文关键词，不能弱化或遗漏核心诉求；所有补充内容必须与原输入强相关，不得跑题。`

    const userMessage = `原始提示词：${userInput}\n\n请在完全保留核心意图的前提下进行深度优化和细化，只补充与上述内容强相关的细节。`

    const response = await fetch('https://api.qnaigc.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-3.0-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 640,
        temperature: 0.9
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || `API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const optimizedPrompt = data?.choices?.[0]?.message?.content?.trim()

    if (!optimizedPrompt) {
      throw new Error('未能生成有效的优化提示词')
    }

    return res.status(200).json({ success: true, prompt: optimizedPrompt, usage: data?.usage })
  } catch (error) {
    console.error('提示词优化错误:', error)
    return res.status(500).json({ error: '优化失败', message: error.message })
  }
}
