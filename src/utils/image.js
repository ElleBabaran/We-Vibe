// src/utils/image.js

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Resize and center-crop an image file to a square JPEG and return base64 payload.
 * Returns the base64 string WITHOUT the data URL prefix.
 */
export async function resizeImageToJpegBase64(file, targetSize = 300, quality = 0.9) {
  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  // Compute cover scaling to fill square without letterboxing
  const scale = Math.max(targetSize / image.width, targetSize / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const dx = (targetSize - scaledWidth) / 2;
  const dy = (targetSize - scaledHeight) / 2;

  context.clearRect(0, 0, targetSize, targetSize);
  context.drawImage(image, dx, dy, scaledWidth, scaledHeight);

  const outDataUrl = canvas.toDataURL('image/jpeg', quality);
  const commaIndex = outDataUrl.indexOf(',');
  return outDataUrl.slice(commaIndex + 1);
}

export default { resizeImageToJpegBase64 };
