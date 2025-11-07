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

// Clean up mask by removing small isolated regions
function cleanupMask(mask: Float32Array, width: number, height: number, minSize: number = 100): Float32Array {
  const cleaned = new Float32Array(mask);
  const visited = new Uint8Array(width * height);
  
  const getIndex = (x: number, y: number) => y * width + x;
  
  // Flood fill to find connected regions
  const floodFill = (startX: number, startY: number): number[] => {
    const stack = [[startX, startY]];
    const region: number[] = [];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = getIndex(x, y);
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[idx]) continue;
      if (mask[idx] < 0.5) continue;
      
      visited[idx] = 1;
      region.push(idx);
      
      // Check 4-connected neighbors
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    return region;
  };
  
  // Find all regions and remove small ones
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIndex(x, y);
      if (!visited[idx] && mask[idx] >= 0.5) {
        const region = floodFill(x, y);
        if (region.length < minSize) {
          // Remove small region
          region.forEach(i => cleaned[i] = 0);
        }
      }
    }
  }
  
  return cleaned;
}

// Dilate mask to expand edges slightly
function dilateMask(mask: Float32Array, width: number, height: number, radius: number = 1): Float32Array {
  const dilated = new Float32Array(mask);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (mask[idx] >= 0.5) {
        // Already foreground, keep it
        continue;
      }
      
      // Check if any neighbor is foreground
      let hasNeighbor = false;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (mask[nIdx] >= 0.5) {
              hasNeighbor = true;
              break;
            }
          }
        }
        if (hasNeighbor) break;
      }
      
      if (hasNeighbor) {
        dilated[idx] = 1;
      }
    }
  }
  
  return dilated;
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
    
    // Find foreground objects (car, person, etc.) and combine their masks
    const foregroundLabels = ['car', 'truck', 'person', 'bus', 'bicycle', 'motorcycle', 'dog', 'cat', 'bird', 'horse', 'boat', 'airplane'];
    const width = canvas.width;
    const height = canvas.height;
    
    // Create combined foreground mask
    const foregroundMask = new Float32Array(width * height);
    foregroundMask.fill(0); // Start with all transparent
    
    for (const segment of result) {
      if (!segment.mask || !segment.mask.data) continue;
      
      const label = segment.label?.toLowerCase() || '';
      const isForeground = foregroundLabels.some(fl => label.includes(fl));
      
      if (isForeground) {
        console.log('Found foreground object:', label);
        // Add this segment to the foreground mask
        for (let i = 0; i < segment.mask.data.length; i++) {
          foregroundMask[i] = Math.max(foregroundMask[i], segment.mask.data[i]);
        }
      }
    }
    
    // Clean up mask - remove small isolated regions (noise)
    const cleanMask = cleanupMask(foregroundMask, width, height);
    
    // Dilate slightly to include edges
    const dilatedMask = dilateMask(cleanMask, width, height, 2);
    
    console.log('Processed foreground mask');
    
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
    
    // Apply foreground mask - keep foreground opaque, make background transparent
    for (let i = 0; i < dilatedMask.length; i++) {
      const maskValue = dilatedMask[i];
      // maskValue: 1 = foreground (keep), 0 = background (remove)
      data[i * 4 + 3] = Math.round(maskValue * 255);
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

