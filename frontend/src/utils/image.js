// Client-side image utilities: compress and resize images before upload
// Waarom: verkleint bestandsgrootte voor snellere uploads en betere UX

export async function compressImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type?.startsWith('image/')) return file;
  const img = await loadImageFromFile(file);
  const { width, height } = fitWithin(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'), { type: blob.type });
}

function fitWithin(w, h, maxW, maxH) {
  const ratio = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
