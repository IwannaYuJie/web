/**
 * 图片处理工具函数
 * 统一处理图片格式转换、下载等操作
 */

/**
 * 将各种格式的图片对象转换为统一格式
 * @param {Array} imageList - 图片数组（可能来自 Fal.ai 或七牛）
 * @returns {Array<{src: string, downloadName: string}>} - 统一格式的图片数组
 */
export const normalizeImages = (imageList = []) => {
  if (!Array.isArray(imageList)) {
    console.warn('图片列表不是数组:', imageList)
    return []
  }

  return imageList.map((item, index) => {
    // 优先使用 url 字段
    if (item?.url) {
      return {
        src: item.url,
        downloadName: item.file_name || `image_${index + 1}.png`
      }
    }

    // 其次尝试 base64 格式
    const base64 = item?.base64 || item?.b64_json || item?.content || ''
    if (base64) {
      return {
        src: `data:image/png;base64,${base64}`,
        downloadName: item?.file_name || `image_${index + 1}.png`
      }
    }

    console.warn('无法识别的图片格式:', item)
    return null
  }).filter(Boolean)
}

/**
 * 通用图片下载处理函数
 * 支持 URL 和 Base64 两种格式
 * @param {string} imageSrc - 图片源（URL 或 Data URL）
 * @param {string} fileName - 下载文件名
 */
export const downloadImage = async (imageSrc, fileName) => {
  try {
    // 如果是 Base64 或 Data URL，直接下载
    if (imageSrc.startsWith('data:')) {
      const link = document.createElement('a')
      link.href = imageSrc
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // 如果是 URL，需要先 fetch 转为 Blob
    const response = await fetch(imageSrc)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理 Blob URL
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('下载图片失败:', err)
    // 降级处理：在新标签页打开
    window.open(imageSrc, '_blank')
  }
}

/**
 * 将文件转换为 Data URL
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - Data URL
 */
export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

/**
 * 生成随机种子
 * @returns {string} - 随机种子字符串
 */
export const generateRandomSeed = () => {
  return String(Math.floor(Math.random() * 9999999999))
}

/**
 * 验证图片尺寸是否在有效范围内
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} min - 最小值（默认 1024）
 * @param {number} max - 最大值（默认 4096）
 * @returns {boolean} - 是否有效
 */
export const isValidImageSize = (width, height, min = 1024, max = 4096) => {
  return [width, height].every(
    (value) => Number.isInteger(value) && value >= min && value <= max
  )
}
