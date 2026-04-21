/**
 * Builds a print-ready PNG from a transparent design image.
 * - Output canvas at 300 DPI
 * - Standard apparel print sizes per product
 * - 0.125" bleed margin around the artwork (visible as faint guide)
 * - Design centered, scaled to fit safe area
 */
const PRODUCT_PRINT_SIZES_INCHES: Record<string, { w: number; h: number }> = {
  hoodie: { w: 12, h: 14 },
  tshirt: { w: 12, h: 14 },
  crewneck: { w: 12, h: 14 },
  cap: { w: 4.5, h: 2.25 },
  tote: { w: 10, h: 10 },
  mug: { w: 8.5, h: 3.5 },
};

const DPI = 300;
const BLEED_INCHES = 0.125;

export async function generatePrintReadyPNG(
  designUrl: string,
  productType: string
): Promise<Blob> {
  const size = PRODUCT_PRINT_SIZES_INCHES[productType] || PRODUCT_PRINT_SIZES_INCHES.tshirt;
  const widthPx = Math.round(size.w * DPI);
  const heightPx = Math.round(size.h * DPI);
  const bleedPx = Math.round(BLEED_INCHES * DPI);

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Transparent background — leave as-is for DTG/screen print
  ctx.clearRect(0, 0, widthPx, heightPx);

  // Load the design
  const img = await loadImage(designUrl);

  // Safe area = canvas minus bleed
  const safeW = widthPx - bleedPx * 2;
  const safeH = heightPx - bleedPx * 2;

  // Fit (contain) the design in the safe area, preserve aspect ratio
  const scale = Math.min(safeW / img.width, safeH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = (widthPx - drawW) / 2;
  const drawY = (heightPx - drawH) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode PNG"))),
      "image/png"
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export function getPrintSpecLabel(productType: string): string {
  const size = PRODUCT_PRINT_SIZES_INCHES[productType] || PRODUCT_PRINT_SIZES_INCHES.tshirt;
  return `${size.w}" × ${size.h}" @ 300 DPI`;
}
