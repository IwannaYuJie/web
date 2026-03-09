import { describe, expect, it, vi } from 'vitest'
import { consumeSSEStream } from '../src/utils/streamUtils'

function createStream(chunks) {
  const encoder = new TextEncoder()

  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

describe('consumeSSEStream', () => {
  it('parses data across chunk boundaries', async () => {
    const onData = vi.fn()
    const stream = createStream([
      'data: {"type":"partial"',
      ',"value":1}\n\n',
      'data: [DONE]\n\n',
    ])

    await consumeSSEStream(stream, onData)

    expect(onData).toHaveBeenCalledTimes(1)
    expect(onData).toHaveBeenCalledWith('{"type":"partial","value":1}')
  })
})
