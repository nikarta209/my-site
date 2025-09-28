// This worker generates a canvas with multiple watermarks at random positions and opacities.
self.onmessage = (event) => {
  const { text, width, height } = event.data;
  if (!text || !width || !height) {
    self.postMessage({ error: 'Invalid input for watermark worker.' });
    return;
  }

  // Use OffscreenCanvas for rendering in a worker
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Watermark properties
  const watermarkCount = 10; // Number of watermarks to draw
  const fontSize = Math.max(12, Math.min(width, height) / 30);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // We control opacity with globalAlpha

  for (let i = 0; i < watermarkCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const angle = (Math.random() - 0.5) * 60; // Random angle between -30 and 30 degrees
    const opacity = Math.random() * 0.05 + 0.05; // Random opacity between 0.05 and 0.10

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // Get the result as an ImageData object
  const imageData = ctx.getImageData(0, 0, width, height);

  // Post the ImageData back to the main thread.
  // The buffer is transferred, not copied, for performance.
  self.postMessage({ imageData }, [imageData.data.buffer]);
};