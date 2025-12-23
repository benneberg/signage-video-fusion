import { motion } from 'framer-motion';
import { Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageFrame } from '@/types/image-video';

interface ImageFrameCardProps {
  frame: ImageFrame;
  index: number;
  onDurationChange: (id: string, duration: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImageFrameCard({ 
  frame, 
  index, 
  onDurationChange, 
  onDuplicate, 
  onRemove 
}: ImageFrameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="video-card rounded-xl p-3 flex items-center gap-3"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img 
          src={frame.url} 
          alt={frame.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{frame.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Duration:</span>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={frame.duration}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0.1) {
                onDurationChange(frame.id, val);
              }
            }}
            className="w-20 h-7 text-xs"
          />
          <span className="text-xs text-muted-foreground">sec</span>
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDuplicate(frame.id)}
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(frame.id)}
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
