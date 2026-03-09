import { consumeSSEStream } from '../utils'
import { extractErrorMessage } from './http'

function normalizeArkImages(images = []) {
  return images.map((img, index) => ({ url: img.url, size: img.size, index: index + 1 }))
}

export async function generateArkImages(requestBody, { endpoint = '/api/generate-image', onPartialImage, onUsage } = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(extractErrorMessage(payload, '图片生成失败'))
  }

  if (requestBody.stream) {
    const allImages = []

    await consumeSSEStream(response.body, async (dataText) => {
      try {
        const data = JSON.parse(dataText)
        if (data.type === 'image_generation.partial_succeeded' && data.url) {
          allImages.push({ url: data.url, size: data.size, image_index: data.image_index })
          onPartialImage?.(normalizeArkImages(allImages))
        }
        if (data.type === 'image_generation.completed') {
          onUsage?.(data.usage)
        }
      } catch (error) {
        console.warn(error)
      }
    })

    if (allImages.length === 0) {
      throw new Error('未能生成图片')
    }

    return normalizeArkImages(allImages)
  }

  const data = await response.json()
  if (!data.data || data.data.length === 0) {
    throw new Error('未能生成图片')
  }

  onUsage?.(data.usage)
  return normalizeArkImages(data.data)
}
