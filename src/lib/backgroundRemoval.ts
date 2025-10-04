import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageUrl: string): Promise<string> => {
  try {
    console.log('Starting background removal process...');
    
    // Load the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, img);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid segmentation result');
    }
    
    // Find the mask with the most coverage (likely the background/sky)
    let backgroundMask = null;
    let maxCoverage = 0;
    
    for (const segment of result) {
      if (!segment.mask || !segment.mask.data) continue;
      
      // Calculate how much of the image this mask covers
      let coverage = 0;
      for (let i = 0; i < segment.mask.data.length; i++) {
        coverage += segment.mask.data[i];
      }
      
      // Labels that typically represent background
      const isBackgroundLabel = ['sky', 'wall', 'floor', 'ceiling', 'background'].includes(
        segment.label?.toLowerCase() || ''
      );
      
      // Prefer background labels with high coverage
      const score = coverage * (isBackgroundLabel ? 1.5 : 1);
      
      if (score > maxCoverage) {
        maxCoverage = score;
        backgroundMask = segment.mask;
      }
    }
    
    if (!backgroundMask) {
      throw new Error('Could not find background mask');
    }
    
    console.log('Using background mask with coverage:', maxCoverage);
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Make background transparent: where mask is 255 (background), set alpha to 0
    for (let i = 0; i < backgroundMask.data.length; i++) {
      const maskValue = backgroundMask.data[i];
      // If this pixel is detected as background (high mask value), make it transparent
      const alpha = 255 - maskValue; // Invert: 255 becomes 0 (transparent), 0 becomes 255 (opaque)
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully - background removed');
    
    // Convert canvas to data URL
    return outputCanvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

