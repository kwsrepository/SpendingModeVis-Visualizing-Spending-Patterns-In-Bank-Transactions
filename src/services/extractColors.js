//取色点颜色输出格式换成“#FFFFFF”这种
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function extractColors(imageSrc, numColors, callback) {
  const img = new Image();
  img.src = imageSrc;
  img.crossOrigin = 'Anonymous'; // 为了处理跨域问题

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const colors = [];
    const positions = [];
    const y = Math.floor(img.height / 2); // 从中部区域提取颜色

    for (let i = 0; i < numColors; i++) {
      const x = Math.floor((i / numColors) * img.width);
      const pixelData = ctx.getImageData(x, y, 1, 1).data;
      const color = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
      colors.push(color);
      positions.push({ x, y });
    }
    callback(colors, positions);
  };

  img.onerror = (err) => {
    console.error("Error loading image:", err);
  };
}
