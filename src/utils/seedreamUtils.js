import { isValidImageSize } from './imageUtils'

export function buildQiniuImageConfig(qiniuAspectRatio, qiniuImageSize) {
  const config = {}

  if (qiniuAspectRatio?.trim()) {
    config.aspect_ratio = qiniuAspectRatio.trim()
  }

  if (qiniuImageSize?.trim()) {
    config.image_size = qiniuImageSize.trim()
  }

  return Object.keys(config).length > 0 ? config : null
}

export function parseImageUrlsText(imageUrlsText = '') {
  return imageUrlsText
    .split('\n')
    .map((raw) => raw.trim())
    .filter(Boolean)
}

export function validateCustomImageSize(width, height) {
  return isValidImageSize(
    Number.parseInt(width, 10),
    Number.parseInt(height, 10)
  )
}
