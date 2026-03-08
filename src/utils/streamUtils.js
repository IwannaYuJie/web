/**
 * 读取并解析 SSE 流。
 * 兼容跨 chunk 的 data 片段，避免流式 JSON 在分片边界处解析失败。
 * @param {ReadableStream<Uint8Array>} stream
 * @param {(data: string) => void | Promise<void>} onData
 */
export async function consumeSSEStream(stream, onData) {
  if (!stream) {
    throw new Error('流不可用')
  }

  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processBlock = async (block) => {
    const dataLines = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())

    if (dataLines.length === 0) {
      return false
    }

    const data = dataLines.join('\n')
    if (data === '[DONE]') {
      return true
    }

    await onData(data)
    return false
  }

  let streamDone = false

  while (!streamDone) {
    const { done, value } = await reader.read()
    streamDone = done
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

    const blocks = buffer.split(/\n\n/)
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      const shouldStop = await processBlock(block)
      if (shouldStop) {
        return
      }
    }
  }

  if (buffer.trim()) {
    await processBlock(buffer)
  }
}
