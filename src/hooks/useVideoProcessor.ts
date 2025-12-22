import { useState, useCallback, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoFile, VideoPreset, ProcessingProgress } from '@/types/video';

export function useVideoProcessor() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'analyzing',
    progress: 0,
    message: 'Ready',
  });
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    setProgress({ stage: 'analyzing', progress: 0, message: 'Loading video processor...' });
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(prev => ({
          ...prev,
          progress: Math.round(p * 100),
        }));
      });

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setIsLoaded(true);
      setProgress({ stage: 'complete', progress: 100, message: 'Ready to process videos' });
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setProgress({ stage: 'error', progress: 0, message: 'Failed to load video processor' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  const analyzeVideo = useCallback(async (file: File): Promise<Partial<VideoFile>> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        
        video.currentTime = 1;
        
        video.onseeked = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            thumbnail,
            codec: detectCodec(file.type),
            frameRate: 30,
            bitrate: Math.round((file.size * 8) / video.duration / 1000),
          });
          
          URL.revokeObjectURL(video.src);
        };
      };
      
      video.onerror = () => {
        resolve({
          duration: 0,
          width: 0,
          height: 0,
          thumbnail: '',
          codec: 'unknown',
          frameRate: 0,
          bitrate: 0,
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
  }, []);

  const encodeVideo = useCallback(async (
    video: VideoFile,
    preset: VideoPreset,
    onProgress: (progress: number) => void
  ): Promise<Blob | null> => {
    if (!ffmpegRef.current || !isLoaded) {
      await loadFFmpeg();
    }
    
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) return null;
    
    try {
      const inputName = `input_${video.id}.mp4`;
      const outputName = `output_${video.id}.mp4`;
      
      await ffmpeg.writeFile(inputName, await fetchFile(video.file));
      
      const args = buildEncodingArgs(inputName, outputName, preset);
      await ffmpeg.exec(args);
      
      const data = await ffmpeg.readFile(outputName);
      const uint8 = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const blob = new Blob([uint8], { type: 'video/mp4' });
      
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
      return blob;
    } catch (error) {
      console.error('Encoding error:', error);
      return null;
    }
  }, [isLoaded, loadFFmpeg]);

  const mergeVideos = useCallback(async (
    videos: VideoFile[],
    preset: VideoPreset | null
  ): Promise<Blob | null> => {
    if (!ffmpegRef.current || !isLoaded) {
      await loadFFmpeg();
    }
    
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || videos.length === 0) return null;
    
    try {
      setProgress({ stage: 'merging', progress: 0, message: 'Preparing videos...' });
      
      const fileList: string[] = [];
      
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const inputName = `input_${i}.mp4`;
        
        setProgress({
          stage: 'merging',
          progress: Math.round((i / videos.length) * 30),
          message: `Loading ${video.name}...`,
          currentFile: video.name,
        });
        
        await ffmpeg.writeFile(inputName, await fetchFile(video.file));
        fileList.push(`file '${inputName}'`);
      }
      
      await ffmpeg.writeFile('list.txt', fileList.join('\n'));
      
      setProgress({ stage: 'merging', progress: 40, message: 'Merging videos...' });
      
      const outputName = 'merged_output.mp4';
      
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        outputName
      ];
      
      await ffmpeg.exec(args);
      
      setProgress({ stage: 'merging', progress: 90, message: 'Finalizing...' });
      
      const data = await ffmpeg.readFile(outputName);
      const uint8 = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const blob = new Blob([uint8], { type: 'video/mp4' });
      
      for (let i = 0; i < videos.length; i++) {
        await ffmpeg.deleteFile(`input_${i}.mp4`);
      }
      await ffmpeg.deleteFile('list.txt');
      await ffmpeg.deleteFile(outputName);
      
      setProgress({ stage: 'complete', progress: 100, message: 'Merge complete!' });
      
      return blob;
    } catch (error) {
      console.error('Merge error:', error);
      setProgress({ stage: 'error', progress: 0, message: 'Failed to merge videos' });
      return null;
    }
  }, [isLoaded, loadFFmpeg]);

  return {
    isLoaded,
    isLoading,
    progress,
    loadFFmpeg,
    analyzeVideo,
    encodeVideo,
    mergeVideos,
  };
}

function detectCodec(mimeType: string): string {
  if (mimeType.includes('h264') || mimeType.includes('avc')) return 'H.264/AVC';
  if (mimeType.includes('h265') || mimeType.includes('hevc')) return 'H.265/HEVC';
  if (mimeType.includes('vp9')) return 'VP9';
  if (mimeType.includes('vp8')) return 'VP8';
  if (mimeType.includes('av1')) return 'AV1';
  if (mimeType.includes('webm')) return 'VP8/VP9';
  if (mimeType.includes('mp4')) return 'H.264/AVC';
  if (mimeType.includes('quicktime') || mimeType.includes('mov')) return 'H.264/ProRes';
  return 'Unknown';
}

function buildEncodingArgs(input: string, output: string, preset: VideoPreset): string[] {
  const args: string[] = ['-i', input];
  
  switch (preset.id) {
    case 'web-optimized':
      args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
      args.push('-c:a', 'aac', '-b:a', '128k');
      break;
    case 'high-quality':
      args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18');
      args.push('-c:a', 'aac', '-b:a', '256k');
      break;
    case 'social-media':
      args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20');
      args.push('-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2');
      args.push('-c:a', 'aac', '-b:a', '192k');
      break;
    case '4k-master':
      args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '15');
      args.push('-c:a', 'aac', '-b:a', '320k');
      break;
    case 'fast-compress':
      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
      args.push('-c:a', 'aac', '-b:a', '96k');
      break;
    default:
      args.push('-c', 'copy');
  }
  
  args.push(output);
  return args;
}
