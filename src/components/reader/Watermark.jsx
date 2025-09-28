
import React, { useEffect, useRef } from 'react';

export default function Watermark({ text, containerRef }) {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    // Initialize the Web Worker from the new, correct path
    workerRef.current = new Worker(new URL('./watermarkWorker.js', import.meta.url));

    const handleMessage = (event) => {
      const { imageData, error } = event.data;
      if (error) {
        console.error('Watermark Worker Error:', error);
        return;
      }
      const canvas = canvasRef.current;
      if (canvas && imageData) {
        // Ensure canvas dimensions are set before drawing
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
      }
    };

    workerRef.current.addEventListener('message', handleMessage);

    // Cleanup on component unmount
    return () => {
      workerRef.current.terminate();
      workerRef.current.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (text && container && workerRef.current) {
        const { width, height } = container.getBoundingClientRect();
        
        // Post message to the worker to start generation
        workerRef.current.postMessage({ text, width, height });
    }
  }, [text, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 100 }}
    />
  );
}
