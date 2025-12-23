import { useCallback, useRef, useState } from 'react';
import { ImageFrame, ImageVideoSettings } from '@/types/image-video';

export function useImageVideoProcessor() {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderVideo = useCallback(async (
    frames: ImageFrame[],
    settings: ImageVideoSettings
  ): Promise<Blob | null> => {
    if (frames.length === 0) {
      setStatus('No images to render');
      return null;
    }

    if (!('MediaRecorder' in window)) {
      setStatus('MediaRecorder not supported in this browser');
      return null;
    }

    const [resW, resH] = settings.resolution.split('x').map(n => parseInt(n));
    const fps = Math.max(1, Math.min(60, Math.round(settings.fps)));
    const padColor = settings.padColor || '#000000';

    const canvas = canvasRef.current;
    if (!canvas) {
      setStatus('Canvas not available');
      return null;
    }

    canvas.width = resW;
    canvas.height = resH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setStatus('Canvas context not available');
      return null;
    }

    setIsRecording(true);
    setStatus('Preparing images...');

    // Load all images as ImageBitmap
    const bitmaps: { bmp: ImageBitmap; duration: number; name: string }[] = [];
    
    for (let i = 0; i < frames.length; i++) {
      try {
        const bmp = await createImageBitmap(frames[i].file);
        bitmaps.push({ bmp, duration: frames[i].duration, name: frames[i].name });
      } catch (err) {
        console.warn('createImageBitmap failed, falling back to Image element', err);
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const imgEl = new Image();
          imgEl.onload = () => resolve(imgEl);
          imgEl.onerror = reject;
          imgEl.src = frames[i].url;
        });
        const tmp = document.createElement('canvas');
        tmp.width = img.width;
        tmp.height = img.height;
        tmp.getContext('2d')?.drawImage(img, 0, 0);
        const bmp = await createImageBitmap(tmp);
        bitmaps.push({ bmp, duration: frames[i].duration, name: frames[i].name });
      }
    }

    setStatus('Starting recording...');
    const stream = canvas.captureStream(fps);
    
    // Choose MIME type with fallback
    let mime = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mime)) {
      mime = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mime)) {
        mime = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mime)) {
          mime = '';
        }
      }
    }

    let recorder: MediaRecorder;
    try {
      recorder = mime 
        ? new MediaRecorder(stream, { mimeType: mime }) 
        : new MediaRecorder(stream);
    } catch (err) {
      console.error('Failed to create MediaRecorder', err);
      setStatus('MediaRecorder creation failed');
      setIsRecording(false);
      return null;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { 
      if (e.data && e.data.size) chunks.push(e.data); 
    };

    recorder.start();
    setStatus('Recording...');

    const frameInterval = 1000 / fps;
    let currentBitmapIndex = 0;
    let frameTimer = 0;
    let totalFrames = 0;
    for (const b of bitmaps) totalFrames += Math.ceil(b.duration * fps);
    let drawnFrames = 0;

    const drawBitmapToCanvas = (bmpObj: { bmp: ImageBitmap }) => {
      ctx.fillStyle = padColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(canvas.width / bmpObj.bmp.width, canvas.height / bmpObj.bmp.height);
      const nw = Math.round(bmpObj.bmp.width * scale);
      const nh = Math.round(bmpObj.bmp.height * scale);
      const x = Math.round((canvas.width - nw) / 2);
      const y = Math.round((canvas.height - nh) / 2);
      ctx.drawImage(bmpObj.bmp, x, y, nw, nh);
    };

    await new Promise<void>((resolve) => {
      const iv = setInterval(() => {
        const current = bitmaps[currentBitmapIndex];
        if (!current) {
          clearInterval(iv);
          resolve();
          return;
        }
        
        drawBitmapToCanvas(current);
        drawnFrames++;
        frameTimer += frameInterval;
        
        if (frameTimer + 1 >= current.duration * 1000) {
          currentBitmapIndex++;
          frameTimer = 0;
        }
        
        setProgress({ current: drawnFrames, total: totalFrames });
        setStatus(`Recording... ${drawnFrames}/${totalFrames} frames`);
        
        if (currentBitmapIndex >= bitmaps.length) {
          clearInterval(iv);
          setTimeout(resolve, 200);
        }
      }, frameInterval);
    });

    recorder.stop();

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    const videoBlob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
    
    setStatus('Done — video ready');
    setIsRecording(false);
    setProgress({ current: 0, total: 0 });
    
    return videoBlob;
  }, []);

  return {
    renderVideo,
    isRecording,
    progress,
    status,
    canvasRef,
    setStatus,
  };
}
