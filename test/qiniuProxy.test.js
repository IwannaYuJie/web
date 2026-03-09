import { describe, expect, it, vi } from 'vitest'
import { callQiniuApi, resolveQiniuKeys, safeParseJson, shapeQiniuErrorBody } from '../shared/server/qiniuProxy'

describe('qiniuProxy helpers', () => {
  it('safeParseJson should fall back to raw text', () => {
    const result = safeParseJson('not-json')
    expect(result.raw).toBe('not-json')
    expect(result.parseError).toBeTruthy()
  })

  it('resolveQiniuKeys should honor selected key', () => {
    expect(resolveQiniuKeys('secondary', 'a', 'b').activeKey).toBe('b')
    expect(resolveQiniuKeys('auto', 'a', 'b').activeKey).toBe('a')
  })

  it('shapeQiniuErrorBody should flatten message', () => {
    expect(shapeQiniuErrorBody({ error: { message: 'denied', type: 'access_denied_error' } }, 'fallback')).toEqual({
      error: 'denied',
      message: 'denied',
      type: 'access_denied_error',
    })
  })

  it('callQiniuApi should mark access_denied_error as retryable', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'denied', type: 'access_denied_error' },
    }), { status: 403 }))

    const result = await callQiniuApi('https://example.com', { hello: 'world' }, 'key', fetchImpl)

    expect(result.ok).toBe(false)
    expect(result.shouldRetry).toBe(true)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })
})
