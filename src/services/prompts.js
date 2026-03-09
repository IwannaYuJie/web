import { requestJson } from './http'

export async function requestRandomPrompt(userInput = '') {
  const data = await requestJson('/api/coser-random', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput }),
  }, '提示词生成服务响应异常')

  if (!data?.prompt) {
    throw new Error('未能获取到有效的提示词')
  }

  return data.prompt
}

export async function requestOptimizedPrompt(userInput) {
  const normalizedInput = userInput?.trim()
  if (!normalizedInput) {
    throw new Error('先写点想法再让我优化吧')
  }

  const data = await requestJson('/api/coser-optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput: normalizedInput }),
  }, '提示词优化服务响应异常')

  if (!data?.prompt) {
    throw new Error('未能获取到优化后的提示词')
  }

  return data.prompt
}
