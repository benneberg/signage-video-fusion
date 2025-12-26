// Playlist JSON Schema Types for Digital Signage

export type MediaType = 'image' | 'video' | 'webpage' | 'interactive';

export interface BasePlaylistItem {
  id: string;
  name: string;
  type: MediaType;
  order: number;
  renderable: boolean;
}

export interface ImagePlaylistItem extends BasePlaylistItem {
  type: 'image';
  file?: File;
  url: string;
  duration: number; // seconds
  renderable: boolean; // user can toggle
}

export interface VideoPlaylistItem extends BasePlaylistItem {
  type: 'video';
  file?: File;
  url: string;
  duration: number; // detected duration
  renderable: boolean; // user can toggle
}

export interface WebpagePlaylistItem extends BasePlaylistItem {
  type: 'webpage';
  url: string;
  duration: number; // display time
  renderable: false; // always non-renderable
}

export interface InteractivePlaylistItem extends BasePlaylistItem {
  type: 'interactive';
  url: string;
  duration: number; // estimated duration
  renderable: false; // always non-renderable
}

export type PlaylistItem = 
  | ImagePlaylistItem 
  | VideoPlaylistItem 
  | WebpagePlaylistItem 
  | InteractivePlaylistItem;

export interface PlaylistSettings {
  resolution: string;
  fps: number;
  defaultImageDuration: number;
  padColor: string;
}

export interface RenderableSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  items: (ImagePlaylistItem | VideoPlaylistItem)[];
  totalDuration: number;
}

export interface PlaylistAnalysis {
  segments: RenderableSegment[];
  nonRenderableItems: PlaylistItem[];
  totalRenderableSegments: number;
  canRenderSingleVideo: boolean;
}

export interface RenderedSegment {
  segmentId: string;
  blob: Blob;
  filename: string;
  duration: number;
}

// JSON Schema for import/export
export interface PlaylistSchema {
  version: '1.0';
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: PlaylistSettings;
  items: PlaylistItemSchema[];
}

export interface PlaylistItemSchema {
  id: string;
  name: string;
  type: MediaType;
  order: number;
  renderable: boolean;
  url: string;
  duration: number;
  // For local files, this will be the filename - actual file must be provided separately
  sourceType: 'url' | 'file';
  filename?: string;
}
