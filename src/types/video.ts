export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  codec: string;
  frameRate: number;
  bitrate: number;
  thumbnail: string;
  url: string;
}

export interface VideoPreset {
  id: string;
  name: string;
  description: string;
  codec: string;
  resolution: string;
  bitrate: string;
  frameRate: number;
  icon: string;
}

export interface ProcessingProgress {
  stage: 'analyzing' | 'encoding' | 'merging' | 'complete' | 'error';
  progress: number;
  message: string;
  currentFile?: string;
}
