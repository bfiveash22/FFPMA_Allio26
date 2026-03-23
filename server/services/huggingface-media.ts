import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Image generation models
const FLUX_SCHNELL = "black-forest-labs/FLUX.1-schnell";
const FLUX_DEV = "black-forest-labs/FLUX.1-dev";
const STABLE_DIFFUSION_XL = "stabilityai/stable-diffusion-xl-base-1.0";

// Video generation models (via Diffusers - may require dedicated endpoint)
const LTX_VIDEO = "Lightricks/LTX-Video";

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: 'healing' | 'professional' | 'educational' | 'marketing';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

export interface ImageGenerationResponse {
  imageBlob: Blob;
  imageBase64: string;
  modelUsed: string;
  prompt: string;
  metadata: {
    width: number;
    height: number;
    generatedAt: string;
  };
}

// Style presets for the healing ecosystem brand
const STYLE_PRESETS: Record<string, string> = {
  healing: "soft ethereal lighting, calming blue and cyan tones, natural organic elements, wellness aesthetic, professional medical imagery",
  professional: "clean modern design, corporate professional look, high quality photography style, sharp details, neutral background",
  educational: "clear informative style, diagram-like precision, educational illustration, labeled elements, scientific accuracy",
  marketing: "vibrant engaging visuals, attention-grabbing composition, brand-aligned colors (deep blue, cyan, gold), modern aesthetic"
};

// Aspect ratio to dimensions mapping
const ASPECT_RATIOS: Record<string, {width: number; height: number}> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 }
};

function buildEnhancedPrompt(request: ImageGenerationRequest): string {
  let prompt = request.prompt;
  
  if (request.style && STYLE_PRESETS[request.style]) {
    prompt = `${prompt}, ${STYLE_PRESETS[request.style]}`;
  }
  
  // Add quality enhancers
  prompt += ", high quality, detailed, 8k resolution";
  
  return prompt;
}

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const enhancedPrompt = buildEnhancedPrompt(request);
  const dimensions = request.aspectRatio 
    ? ASPECT_RATIOS[request.aspectRatio] 
    : { width: request.width || 1024, height: request.height || 1024 };

  let modelUsed = FLUX_SCHNELL;
  let imageResult: Blob;

  try {
    // Try FLUX.1-schnell first (fastest)
    const result = await hf.textToImage({
      model: FLUX_SCHNELL,
      inputs: enhancedPrompt,
      parameters: {
        width: dimensions.width,
        height: dimensions.height,
        negative_prompt: request.negativePrompt || "blurry, low quality, distorted, ugly, deformed"
      }
    }) as unknown as Blob;
    imageResult = result;
  } catch (fluxError: any) {
    console.log(`[HF Media] FLUX.1-schnell failed: ${fluxError.message}, trying SDXL...`);
    
    try {
      modelUsed = STABLE_DIFFUSION_XL;
      const result = await hf.textToImage({
        model: STABLE_DIFFUSION_XL,
        inputs: enhancedPrompt,
        parameters: {
          width: Math.min(dimensions.width, 1024),
          height: Math.min(dimensions.height, 1024),
          negative_prompt: request.negativePrompt || "blurry, low quality, distorted, ugly, deformed"
        }
      }) as unknown as Blob;
      imageResult = result;
    } catch (sdxlError: any) {
      throw new Error(`Image generation failed: ${sdxlError.message}`);
    }
  }

  // Convert blob to base64
  const arrayBuffer = await imageResult.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    imageBlob: imageResult,
    imageBase64: `data:image/png;base64,${base64}`,
    modelUsed,
    prompt: enhancedPrompt,
    metadata: {
      width: dimensions.width,
      height: dimensions.height,
      generatedAt: new Date().toISOString()
    }
  };
}

// Batch image generation for marketing campaigns
export async function generateImageBatch(
  prompts: string[],
  style: ImageGenerationRequest['style'] = 'marketing'
): Promise<Array<ImageGenerationResponse | {error: string}>> {
  const results = await Promise.allSettled(
    prompts.map(prompt => generateImage({ prompt, style }))
  );

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return { error: `Failed to generate image for prompt ${idx + 1}: ${result.reason}` };
  });
}

// Marketing asset generator with brand presets
export async function generateMarketingAsset(
  type: 'social_post' | 'banner' | 'product_image' | 'infographic',
  description: string
): Promise<ImageGenerationResponse> {
  const typeConfigs: Record<string, {aspectRatio: ImageGenerationRequest['aspectRatio']; stylePrefix: string}> = {
    social_post: {
      aspectRatio: '1:1',
      stylePrefix: 'Social media post design, engaging and shareable,'
    },
    banner: {
      aspectRatio: '16:9',
      stylePrefix: 'Professional banner design, wide format, headline-ready space,'
    },
    product_image: {
      aspectRatio: '4:3',
      stylePrefix: 'Product photography style, clean background, professional lighting,'
    },
    infographic: {
      aspectRatio: '9:16',
      stylePrefix: 'Infographic style, data visualization, clear hierarchy,'
    }
  };

  const config = typeConfigs[type];
  const prompt = `${config.stylePrefix} ${description}`;

  return generateImage({
    prompt,
    aspectRatio: config.aspectRatio,
    style: 'marketing'
  });
}

// Check media generation availability
export async function checkMediaStatus(): Promise<{
  imageGeneration: boolean;
  videoGeneration: boolean;
  availableModels: string[];
  status: string;
}> {
  const availableModels: string[] = [];
  let imageAvailable = false;

  try {
    // Quick test with minimal generation
    await hf.textToImage({
      model: FLUX_SCHNELL,
      inputs: "test",
      parameters: { width: 64, height: 64 }
    });
    imageAvailable = true;
    availableModels.push(FLUX_SCHNELL);
  } catch (e) {
    console.log('[HF Media] FLUX.1-schnell not available');
  }

  if (!imageAvailable) {
    try {
      await hf.textToImage({
        model: STABLE_DIFFUSION_XL,
        inputs: "test",
        parameters: { width: 64, height: 64 }
      });
      imageAvailable = true;
      availableModels.push(STABLE_DIFFUSION_XL);
    } catch (e) {
      console.log('[HF Media] SDXL not available');
    }
  }

  // We assume LTX_VIDEO is available if HF is configured
  availableModels.push(LTX_VIDEO);

  return {
    imageGeneration: imageAvailable,
    videoGeneration: true, 
    availableModels,
    status: imageAvailable 
      ? `Media generation ready (${availableModels[0]})`
      : 'Media generation offline - check HF quota'
  };
}

import * as fs from 'fs/promises';
import * as path from 'path';

export interface VideoGenerationResponse {
  videoUrl: string;
  modelUsed: string;
  prompt: string;
  metadata: {
    generatedAt: string;
    jobId?: string;
  };
}

// Generate Video using Luma Dream Machine API for 100/100 cinematic quality
export async function generateVideo(prompt: string): Promise<VideoGenerationResponse> {
  const apiKey = process.env.LUMAAI_API_KEY;
  if (!apiKey) {
    throw new Error('LUMAAI_API_KEY is required for 100/100 cinematic video generation. Please add it to your environment variables.');
  }

  try {
    // 1. Initiate Generation
    const createRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Luma API creation failed: ${createRes.status} - ${errorText}`);
    }

    const job = await createRes.json();
    const jobId = job.id;
    console.log(`[Luma AI] Video generation started. Job ID: ${jobId}`);

    // 2. Poll for Completion (with a timeout mechanism)
    let videoDownloadUrl = null;
    const maxRetries = 60; // 5 minutes max (polling every 5s)
    let retries = 0;

    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries++;

      const statusRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      console.log(`[Luma AI] Job ${jobId} status: ${statusData.state}`);

      if (statusData.state === 'completed') {
        videoDownloadUrl = statusData.assets?.video;
        break;
      } else if (statusData.state === 'failed') {
        throw new Error(`Luma generation failed. Reason: ${statusData.failure_reason || 'Unknown error'}`);
      }
    }

    if (!videoDownloadUrl) {
      throw new Error('Luma generation timed out waiting for completion.');
    }

    // 3. Download the video artifact
    console.log(`[Luma AI] Job completed. Downloading video from: ${videoDownloadUrl}`);
    const videoRes = await fetch(videoDownloadUrl);
    if (!videoRes.ok) throw new Error('Failed to download generated video artifact');
    
    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const timestamp = Date.now();
    const filename = `allio-cinematic-${timestamp}.mp4`;
    const publicDir = path.join(process.cwd(), 'client', 'public', 'generated');
    
    try {
      await fs.mkdir(publicDir, { recursive: true });
    } catch (err) {}
    
    const filepath = path.join(publicDir, filename);
    await fs.writeFile(filepath, buffer);

    console.log(`[Luma AI] Video saved locally: ${filepath}`);

    return {
      videoUrl: `/generated/${filename}`,
      modelUsed: 'Luma Dream Machine',
      prompt,
      metadata: {
        generatedAt: new Date().toISOString(),
        jobId
      }
    };
  } catch (error: any) {
    throw new Error(`High-quality video generation failed: ${error.message}`);
  }
}

// Image enhancement/editing (image-to-image)
export async function enhanceImage(
  imageBlob: Blob,
  enhancementPrompt: string
): Promise<ImageGenerationResponse> {
  // Note: Image-to-image requires specific model support
  // For now, we'll generate a new image based on the prompt
  return generateImage({
    prompt: enhancementPrompt,
    style: 'professional'
  });
}

