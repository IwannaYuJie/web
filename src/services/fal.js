import { fal } from '@fal-ai/client'

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function appendSeed(payload, seed) {
  if (!seed?.trim()) {
    return
  }

  const parsedSeed = Number.parseInt(seed.trim(), 10)
  if (!Number.isNaN(parsedSeed)) {
    payload.seed = parsedSeed
  }
}

async function uploadImage(file, errorMessage) {
  try {
    return await fal.storage.upload(file)
  } catch (error) {
    throw new Error(error?.message || errorMessage)
  }
}

export async function buildFalGenerationRequest({
  modelType,
  mode,
  prompt,
  imageSizeInput,
  numImages,
  syncMode,
  safetyChecker,
  seed,
  controlScaleNumber,
  imageInputMethod,
  uploadedImage,
  presetUrlList,
  numInferenceSteps,
  enablePromptExpansion,
  outputFormat,
  acceleration,
  zImageStrength,
  aspectRatio,
  resolution,
}) {
  if (modelType === 'v4' || modelType === 'v4.5') {
    const inputPayload = {
      prompt: prompt.trim(),
      image_size: imageSizeInput,
      num_images: parsePositiveInt(numImages, 1),
      sync_mode: syncMode,
      enable_safety_checker: safetyChecker,
    }

    appendSeed(inputPayload, seed)

    if (mode === 'edit') {
      inputPayload.control_scale = controlScaleNumber
      inputPayload.image_urls = imageInputMethod === 'upload'
        ? [await uploadImage(uploadedImage, '😿 上传基础图像失败，请稍后再试')]
        : presetUrlList
    }

    const baseModelId = modelType === 'v4'
      ? 'fal-ai/bytedance/seedream/v4'
      : 'fal-ai/bytedance/seedream/v4.5'

    return {
      modelId: mode === 'edit' ? `${baseModelId}/edit` : `${baseModelId}/text-to-image`,
      inputPayload,
    }
  }

  if (modelType === 'z-image-turbo') {
    const isEditMode = mode === 'edit'
    const inputPayload = {
      prompt: prompt.trim(),
      image_size: imageSizeInput || (isEditMode ? 'auto' : 'landscape_4_3'),
      num_inference_steps: numInferenceSteps,
      num_images: parsePositiveInt(numImages, 1),
      enable_safety_checker: safetyChecker,
      enable_prompt_expansion: enablePromptExpansion,
      output_format: outputFormat,
      acceleration,
      sync_mode: syncMode,
    }

    appendSeed(inputPayload, seed)

    if (isEditMode) {
      inputPayload.strength = zImageStrength
      inputPayload.image_url = imageInputMethod === 'upload'
        ? await uploadImage(uploadedImage, '😿 上传基础图像失败，请稍后再试')
        : presetUrlList[0]
    }

    return {
      modelId: isEditMode ? 'fal-ai/z-image/turbo/image-to-image' : 'fal-ai/z-image/turbo',
      inputPayload,
    }
  }

  const isGeminiEditMode = mode === 'edit'
  const inputPayload = {
    prompt: prompt.trim(),
    num_images: parsePositiveInt(numImages, 1),
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    sync_mode: syncMode,
    resolution,
  }

  if (isGeminiEditMode) {
    inputPayload.image_urls = imageInputMethod === 'upload'
      ? [await uploadImage(uploadedImage, '😿 上传基础图像失败，请稍后再试')]
      : presetUrlList
  }

  return {
    modelId: isGeminiEditMode
      ? 'fal-ai/gemini-3-pro-image-preview/edit'
      : 'fal-ai/gemini-3-pro-image-preview',
    inputPayload,
  }
}
