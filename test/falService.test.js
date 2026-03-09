import { describe, expect, it } from 'vitest'
import { buildFalGenerationRequest } from '../src/services/fal'

describe('fal service helpers', () => {
  it('builds v4 text-to-image payload', async () => {
    const result = await buildFalGenerationRequest({
      modelType: 'v4',
      mode: 'text',
      prompt: 'cat',
      imageSizeInput: 'auto_4K',
      numImages: 2,
      syncMode: false,
      safetyChecker: true,
      seed: '42',
      controlScaleNumber: 0.7,
      imageInputMethod: 'upload',
      uploadedImage: null,
      presetUrlList: [],
      numInferenceSteps: 8,
      enablePromptExpansion: false,
      outputFormat: 'png',
      acceleration: 'none',
      zImageStrength: 0.6,
      aspectRatio: '1:1',
      resolution: '2K',
    })

    expect(result).toEqual({
      modelId: 'fal-ai/bytedance/seedream/v4/text-to-image',
      inputPayload: {
        prompt: 'cat',
        image_size: 'auto_4K',
        num_images: 2,
        sync_mode: false,
        enable_safety_checker: true,
        seed: 42,
      },
    })
  })

  it('builds gemini edit payload from preset urls', async () => {
    const result = await buildFalGenerationRequest({
      modelType: 'new',
      mode: 'edit',
      prompt: 'cat',
      imageSizeInput: 'auto_4K',
      numImages: 1,
      syncMode: true,
      safetyChecker: false,
      seed: '',
      controlScaleNumber: 0.7,
      imageInputMethod: 'urls',
      uploadedImage: null,
      presetUrlList: ['https://example.com/a.png'],
      numInferenceSteps: 8,
      enablePromptExpansion: false,
      outputFormat: 'png',
      acceleration: 'none',
      zImageStrength: 0.6,
      aspectRatio: '16:9',
      resolution: '4K',
    })

    expect(result.modelId).toBe('fal-ai/gemini-3-pro-image-preview/edit')
    expect(result.inputPayload.image_urls).toEqual(['https://example.com/a.png'])
  })
})
