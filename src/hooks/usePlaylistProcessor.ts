import { useCallback, useRef, useState } from 'react';
import { 
  PlaylistItem, 
  PlaylistSettings, 
  PlaylistAnalysis, 
  RenderableSegment,
  RenderedSegment,
  ImagePlaylistItem,
  VideoPlaylistItem
} from '@/types/playlist';

interface ProcessingProgress {
  stage: 'analyzing' | 'rendering' | 'done' | 'idle';
  currentSegment: number;
  totalSegments: number;
  currentFrame: number;
  totalFrames: number;
  message: string;
}

export function usePlaylistProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'idle',
    currentSegment: 0,
    totalSegments: 0,
    currentFrame: 0,
    totalFrames: 0,
    message: ''
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef(false);

  // Analyze playlist and identify renderable segments
  const analyzePlaylist = useCallback((items: PlaylistItem[]): PlaylistAnalysis => {
    const segments: RenderableSegment[] = [];
    const nonRenderableItems: PlaylistItem[] = [];
    
    let currentSegment: (ImagePlaylistItem | VideoPlaylistItem)[] = [];
    let segmentStartIndex = 0;
    
    items.forEach((item, index) => {
      if (item.renderable) {
        if (currentSegment.length === 0) {
          segmentStartIndex = index;
        }
        currentSegment.push(item as ImagePlaylistItem | VideoPlaylistItem);
      } else {
        // Non-renderable item encountered - close current segment
        if (currentSegment.length > 0) {
          const totalDuration = currentSegment.reduce((sum, i) => sum + i.duration, 0);
          segments.push({
            id: `segment-${segments.length + 1}`,
            startIndex: segmentStartIndex,
            endIndex: index - 1,
            items: [...currentSegment],
            totalDuration
          });
          currentSegment = [];
        }
        nonRenderableItems.push(item);
      }
    });
    
    // Close final segment if exists
    if (currentSegment.length > 0) {
      const totalDuration = currentSegment.reduce((sum, i) => sum + i.duration, 0);
      segments.push({
        id: `segment-${segments.length + 1}`,
        startIndex: segmentStartIndex,
        endIndex: items.length - 1,
        items: [...currentSegment],
        totalDuration
      });
    }
    
    return {
      segments,
      nonRenderableItems,
      totalRenderableSegments: segments.length,
      canRenderSingleVideo: segments.length === 1 && nonRenderableItems.length === 0
    };
  }, []);

  // Render a single segment to video
  const renderSegment = useCallback(async (
    segment: RenderableSegment,
    settings: PlaylistSettings,
    segmentIndex: number,
    totalSegments: number
  ): Promise<Blob | null> => {
    if (abortRef.current) return null;
    
    const [resW, resH] = settings.resolution.split('x').map(n => parseInt(n));
    const fps = Math.max(1, Math.min(60, Math.round(settings.fps)));
    const padColor = settings.padColor || '#000000';
    
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    canvas.width = resW;
    canvas.height = resH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Prepare media items
    const mediaItems: { 
      type: 'image' | 'video'; 
      element: ImageBitmap | HTMLVideoElement; 
      duration: number;
      name: string;
    }[] = [];
    
    for (const item of segment.items) {
      if (abortRef.current) return null;
      
      if (item.type === 'image') {
        try {
          let bmp: ImageBitmap;
          if (item.file) {
            bmp = await createImageBitmap(item.file);
          } else {
            const img = await loadImage(item.url);
            bmp = await createImageBitmap(img);
          }
          mediaItems.push({ type: 'image', element: bmp, duration: item.duration, name: item.name });
        } catch (err) {
          console.warn('Failed to load image:', item.name, err);
        }
      } else if (item.type === 'video') {
        try {
          const video = await loadVideo(item.url);
          mediaItems.push({ type: 'video', element: video, duration: item.duration, name: item.name });
        } catch (err) {
          console.warn('Failed to load video:', item.name, err);
        }
      }
    }
    
    if (mediaItems.length === 0) return null;
    
    // Calculate total frames
    let totalFrames = 0;
    for (const item of mediaItems) {
      totalFrames += Math.ceil(item.duration * fps);
    }
    
    setProgress(p => ({
      ...p,
      stage: 'rendering',
      currentSegment: segmentIndex + 1,
      totalSegments,
      currentFrame: 0,
      totalFrames,
      message: `Rendering segment ${segmentIndex + 1}/${totalSegments}...`
    }));
    
    // Setup MediaRecorder
    const stream = canvas.captureStream(fps);
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }
    
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    
    recorder.start();
    
    const frameInterval = 1000 / fps;
    let currentItemIndex = 0;
    let frameTimer = 0;
    let drawnFrames = 0;
    
    const drawFrame = (item: typeof mediaItems[0]) => {
      ctx.fillStyle = padColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      let srcWidth: number, srcHeight: number;
      
      if (item.type === 'image') {
        const bmp = item.element as ImageBitmap;
        srcWidth = bmp.width;
        srcHeight = bmp.height;
        const scale = Math.min(canvas.width / srcWidth, canvas.height / srcHeight);
        const nw = Math.round(srcWidth * scale);
        const nh = Math.round(srcHeight * scale);
        const x = Math.round((canvas.width - nw) / 2);
        const y = Math.round((canvas.height - nh) / 2);
        ctx.drawImage(bmp, x, y, nw, nh);
      } else {
        const video = item.element as HTMLVideoElement;
        srcWidth = video.videoWidth;
        srcHeight = video.videoHeight;
        const scale = Math.min(canvas.width / srcWidth, canvas.height / srcHeight);
        const nw = Math.round(srcWidth * scale);
        const nh = Math.round(srcHeight * scale);
        const x = Math.round((canvas.width - nw) / 2);
        const y = Math.round((canvas.height - nh) / 2);
        ctx.drawImage(video, x, y, nw, nh);
      }
    };
    
    await new Promise<void>((resolve) => {
      const renderLoop = setInterval(async () => {
        if (abortRef.current) {
          clearInterval(renderLoop);
          resolve();
          return;
        }
        
        const currentItem = mediaItems[currentItemIndex];
        if (!currentItem) {
          clearInterval(renderLoop);
          setTimeout(resolve, 200);
          return;
        }
        
        // Handle video playback
        if (currentItem.type === 'video') {
          const video = currentItem.element as HTMLVideoElement;
          if (video.paused) {
            video.currentTime = 0;
            await video.play();
          }
        }
        
        drawFrame(currentItem);
        drawnFrames++;
        frameTimer += frameInterval;
        
        if (frameTimer + 1 >= currentItem.duration * 1000) {
          // Pause video if moving to next item
          if (currentItem.type === 'video') {
            (currentItem.element as HTMLVideoElement).pause();
          }
          currentItemIndex++;
          frameTimer = 0;
        }
        
        setProgress(p => ({
          ...p,
          currentFrame: drawnFrames,
          message: `Rendering segment ${segmentIndex + 1}/${totalSegments}: ${drawnFrames}/${totalFrames} frames`
        }));
        
        if (currentItemIndex >= mediaItems.length) {
          clearInterval(renderLoop);
          setTimeout(resolve, 200);
        }
      }, frameInterval);
    });
    
    recorder.stop();
    
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    
    // Cleanup
    for (const item of mediaItems) {
      if (item.type === 'image') {
        (item.element as ImageBitmap).close();
      }
    }
    
    return new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
  }, []);

  // Render all segments
  const renderPlaylist = useCallback(async (
    items: PlaylistItem[],
    settings: PlaylistSettings
  ): Promise<RenderedSegment[]> => {
    abortRef.current = false;
    setIsProcessing(true);
    
    setProgress({
      stage: 'analyzing',
      currentSegment: 0,
      totalSegments: 0,
      currentFrame: 0,
      totalFrames: 0,
      message: 'Analyzing playlist...'
    });
    
    const analysis = analyzePlaylist(items);
    const renderedSegments: RenderedSegment[] = [];
    
    for (let i = 0; i < analysis.segments.length; i++) {
      if (abortRef.current) break;
      
      const segment = analysis.segments[i];
      const blob = await renderSegment(segment, settings, i, analysis.segments.length);
      
      if (blob) {
        renderedSegments.push({
          segmentId: segment.id,
          blob,
          filename: analysis.canRenderSingleVideo 
            ? 'playlist-output.webm' 
            : `playlist-segment-${i + 1}.webm`,
          duration: segment.totalDuration
        });
      }
    }
    
    setProgress(p => ({
      ...p,
      stage: 'done',
      message: `Rendered ${renderedSegments.length} segment(s)`
    }));
    
    setIsProcessing(false);
    return renderedSegments;
  }, [analyzePlaylist, renderSegment]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    setProgress({
      stage: 'idle',
      currentSegment: 0,
      totalSegments: 0,
      currentFrame: 0,
      totalFrames: 0,
      message: ''
    });
  }, []);

  return {
    analyzePlaylist,
    renderPlaylist,
    isProcessing,
    progress,
    canvasRef,
    abort,
    reset
  };
}

// Helper functions
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    video.onloadeddata = () => resolve(video);
    video.onerror = reject;
    video.src = src;
    video.load();
  });
}
