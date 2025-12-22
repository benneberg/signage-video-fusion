import { motion } from 'framer-motion';
import { VideoFile } from '@/types/video';
import { Clock, Film, Maximize2, Zap, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
  video: VideoFile;
  index: number;
  onRemove: (id: string) => void;
}

export function VideoCard({ video, index, onRemove }: VideoCardProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="video-card rounded-xl overflow-hidden group"
    >
      <div className="flex gap-3 p-3">
        {/* Drag Handle */}
        <div className="flex items-center opacity-30 group-hover:opacity-60 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>
        
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden bg-muted">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm text-xs font-mono">
            {formatDuration(video.duration)}
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4 className="font-medium text-sm truncate text-foreground">
              {video.name}
            </h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {formatFileSize(video.size)}
            </p>
          </div>
          
          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              <Maximize2 className="w-3 h-3" />
              {video.width}×{video.height}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs">
              <Zap className="w-3 h-3" />
              {video.codec}
            </span>
            {video.bitrate > 0 && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                {video.bitrate} kbps
              </span>
            )}
          </div>
        </div>
        
        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(video.id)}
          className="flex-shrink-0 opacity-50 hover:opacity-100 hover:text-destructive transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
