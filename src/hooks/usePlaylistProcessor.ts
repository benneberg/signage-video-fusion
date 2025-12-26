import { useCallback, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
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
  stage: 'idle' | 'loading' | 'analyzing' | 'rendering' | 'done' | 'error';
  currentSegment: number;
  totalSegments: number;
  currentItem: number;
  totalItems: number;
  message: string;
  percent: number;
}

export function usePlaylistProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'idle',
    currentSegment: 0,
    totalSegments: 0,
    currentItem: 0,
    totalItems: 0,
    message: '',
    percent: 0
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const abortRef = useRef(false);
  const isLoadedRef = useRef(false);

  // Load FFmpeg
  const loadFFmpeg = useCallback(async () => {
    if (isLoadedRef.current && ffmpegRef.current) return true;
    
    setProgress(p => ({ ...p, stage: 'loading', message: 'Loading video processor...' }));
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Playlist]', message);
      });
      
      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(prev => ({
          ...prev,
          percent: Math.round(p * 100)
        }));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      isLoadedRef.current = true;
      return true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setProgress(p => ({ ...p, stage: 'error', message: 'Failed to load video processor' }));
      return false;
    }
  }, []);

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

  // Render image to video clip using canvas + FFmpeg
  const renderImageToClip = useCallback(async (
    ffmpeg: FFmpeg,
    item: ImagePlaylistItem,
    index: number,
    settings: PlaylistSettings
  ): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const [resW, resH] = settings.resolution.split('x').map(n => parseInt(n));
    canvas.width = resW;
    canvas.height = resH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    try {
      // Load image
      let bmp: ImageBitmap;
      if (item.file) {
        bmp = await createImageBitmap(item.file);
      } else {
        const img = await loadImage(item.url);
        bmp = await createImageBitmap(img);
      }
      
      // Draw with padding
      ctx.fillStyle = settings.padColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const scale = Math.min(canvas.width / bmp.width, canvas.height / bmp.height);
      const nw = Math.round(bmp.width * scale);
      const nh = Math.round(bmp.height * scale);
      const x = Math.round((canvas.width - nw) / 2);
      const y = Math.round((canvas.height - nh) / 2);
      ctx.drawImage(bmp, x, y, nw, nh);
      bmp.close();
      
      // Get image data as PNG
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const inputName = `img_${index}.png`;
      const outputName = `clip_img_${index}.mp4`;
      
      await ffmpeg.writeFile(inputName, bytes);
      
      // Create video from still image
      await ffmpeg.exec([
        '-loop', '1',
        '-i', inputName,
        '-c:v', 'libx264',
        '-t', item.duration.toString(),
        '-pix_fmt', 'yuv420p',
        '-r', settings.fps.toString(),
        '-vf', `scale=${resW}:${resH}`,
        outputName
      ]);
      
      await ffmpeg.deleteFile(inputName);
      return outputName;
    } catch (err) {
      console.warn('Failed to render image:', item.name, err);
      return null;
    }
  }, []);

  // Process video clip (re-encode for consistency)
  const processVideoClip = useCallback(async (
    ffmpeg: FFmpeg,
    item: VideoPlaylistItem,
    index: number,
    settings: PlaylistSettings
  ): Promise<string | null> => {
    const [resW, resH] = settings.resolution.split('x').map(n => parseInt(n));
    
    try {
      const inputName = `vid_${index}_input.mp4`;
      const outputName = `clip_vid_${index}.mp4`;
      
      await ffmpeg.writeFile(inputName, await fetchFile(item.file || item.url));
      
      // Re-encode for consistent format
      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-r', settings.fps.toString(),
        '-vf', `scale=${resW}:${resH}:force_original_aspect_ratio=decrease,pad=${resW}:${resH}:(ow-iw)/2:(oh-ih)/2:color=${settings.padColor.replace('#', '0x')}`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        outputName
      ]);
      
      await ffmpeg.deleteFile(inputName);
      return outputName;
    } catch (err) {
      console.warn('Failed to process video:', item.name, err);
      return null;
    }
  }, []);

  // Render a single segment to video
  const renderSegment = useCallback(async (
    segment: RenderableSegment,
    settings: PlaylistSettings,
    segmentIndex: number,
    totalSegments: number
  ): Promise<Blob | null> => {
    if (abortRef.current) return null;
    
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return null;
    
    const clipFiles: string[] = [];
    
    setProgress(p => ({
      ...p,
      stage: 'rendering',
      currentSegment: segmentIndex + 1,
      totalSegments,
      currentItem: 0,
      totalItems: segment.items.length,
      message: `Rendering segment ${segmentIndex + 1}/${totalSegments}...`
    }));
    
    // Process each item in segment
    for (let i = 0; i < segment.items.length; i++) {
      if (abortRef.current) break;
      
      const item = segment.items[i];
      
      setProgress(p => ({
        ...p,
        currentItem: i + 1,
        message: `Processing ${item.name}...`
      }));
      
      let clipName: string | null = null;
      
      if (item.type === 'image') {
        clipName = await renderImageToClip(ffmpeg, item as ImagePlaylistItem, i, settings);
      } else if (item.type === 'video') {
        clipName = await processVideoClip(ffmpeg, item as VideoPlaylistItem, i, settings);
      }
      
      if (clipName) {
        clipFiles.push(clipName);
      }
    }
    
    if (clipFiles.length === 0 || abortRef.current) return null;
    
    // Concatenate all clips
    setProgress(p => ({
      ...p,
      message: `Merging segment ${segmentIndex + 1}...`
    }));
    
    const listContent = clipFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('concat_list.txt', listContent);
    
    const outputName = `segment_${segmentIndex}.mp4`;
    
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c', 'copy',
      outputName
    ]);
    
    // Read output
    const data = await ffmpeg.readFile(outputName);
    const uint8 = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
    const blob = new Blob([uint8], { type: 'video/mp4' });
    
    // Cleanup
    for (const file of clipFiles) {
      try { await ffmpeg.deleteFile(file); } catch {}
    }
    try { await ffmpeg.deleteFile('concat_list.txt'); } catch {}
    try { await ffmpeg.deleteFile(outputName); } catch {}
    
    return blob;
  }, [renderImageToClip, processVideoClip]);

  // Render all segments
  const renderPlaylist = useCallback(async (
    items: PlaylistItem[],
    settings: PlaylistSettings
  ): Promise<RenderedSegment[]> => {
    abortRef.current = false;
    setIsProcessing(true);
    
    // Load FFmpeg if needed
    const loaded = await loadFFmpeg();
    if (!loaded) {
      setIsProcessing(false);
      return [];
    }
    
    setProgress({
      stage: 'analyzing',
      currentSegment: 0,
      totalSegments: 0,
      currentItem: 0,
      totalItems: 0,
      message: 'Analyzing playlist...',
      percent: 0
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
            ? 'playlist-output.mp4' 
            : `playlist-segment-${i + 1}.mp4`,
          duration: segment.totalDuration
        });
      }
    }
    
    setProgress(p => ({
      ...p,
      stage: 'done',
      message: `Rendered ${renderedSegments.length} segment(s)`,
      percent: 100
    }));
    
    setIsProcessing(false);
    return renderedSegments;
  }, [loadFFmpeg, analyzePlaylist, renderSegment]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    setProgress({
      stage: 'idle',
      currentSegment: 0,
      totalSegments: 0,
      currentItem: 0,
      totalItems: 0,
      message: '',
      percent: 0
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
