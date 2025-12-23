export interface ImageFrame {
  id: string;
  file: File;
  name: string;
  duration: number;
  url: string;
}

export interface ImageVideoSettings {
  resolution: string;
  fps: number;
  defaultDuration: number;
  padColor: string;
}
