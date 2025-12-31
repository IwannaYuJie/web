/**
 * API 请求工具函数
 * 统一处理 API 调用、错误处理等
 */

/**
 * 发送邮件通知
 * @param {boolean} success - 是否成功
 * @param {Array} images - 图片数组（成功时）
 * @param {string} error - 错误信息（失败时）
 * @param {string} promptText - 生成用的 prompt
 * @param {string} source - 来源标识
 */
export const sendEmailNotification = async (success, images, error, promptText, source) => {
  try {
    await fetch('/api/notify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success,
        images: success ? images : undefined,
        error: success ? undefined : error,
        prompt: promptText,
        source
      })
    })
    console.log('邮件通知已发送')
  } catch (emailError) {
    console.error('发送邮件通知失败:', emailError)
  }
}

/**
 * 生成随机提示词
 * @param {string} userInput - 用户输入（可选）
 * @returns {Promise<string>} - 生成的提示词
 */
export const generateRandomPrompt = async (userInput = '') => {
  const response = await fetch('/api/coser-random', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput })
  })

  if (!response.ok) {
    throw new Error('提示词生成服务响应异常')
  }

  const data = await response.json()
  const prompt = data?.prompt

  if (!prompt) {
    throw new Error('未能获取到有效的提示词')
  }

  return prompt
}

/**
 * 优化提示词
 * @param {string} userInput - 用户输入
 * @returns {Promise<string>} - 优化后的提示词
 */
export const optimizePrompt = async (userInput) => {
  if (!userInput.trim()) {
    throw new Error('先写点想法再让我优化吧')
  }

  const response = await fetch('/api/coser-optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput: userInput.trim() })
  })

  if (!response.ok) {
    throw new Error('提示词优化服务响应异常')
  }

  const data = await response.json()
  const prompt = data?.prompt

  if (!prompt) {
    throw new Error('未能获取到优化后的提示词')
  }

  return prompt
}

/**
 * 调用七牛文生图 API
 * @param {Object} payload - 请求参数
 * @param {string} keyChoice - API Key 选择
 * @param {AbortSignal} signal - 中断信号
 * @returns {Promise<Object>} - 返回数据
 */
export const callQiniuTextToImage = async (payload, keyChoice = 'auto', signal) => {
  const response = await fetch('/api/qiniu-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Qiniu-Key': keyChoice
    },
    body: JSON.stringify(payload),
    signal
  })

  const data = await response.json()

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || data?.error || '七牛文生图调用失败'
    throw new Error(errorMsg)
  }

  return data
}

/**
 * 调用七牛图生图 API
 * @param {Object} payload - 请求参数
 * @param {string} keyChoice - API Key 选择
 * @param {AbortSignal} signal - 中断信号
 * @returns {Promise<Object>} - 返回数据
 */
export const callQiniuImageToImage = async (payload, keyChoice = 'auto', signal) => {
  const response = await fetch('/api/qiniu-image-edits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Qiniu-Key': keyChoice
    },
    body: JSON.stringify(payload),
    signal
  })

  const data = await response.json()

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || data?.error || '七牛图生图调用失败'
    throw new Error(errorMsg)
  }

  return data
}
