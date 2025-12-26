import { motion } from 'framer-motion';
import { 
  Image, 
  Film, 
  Globe, 
  Gamepad2, 
  GripVertical, 
  X, 
  Clock,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { PlaylistItem } from '@/types/playlist';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlaylistItemCardProps {
  item: PlaylistItem;
  index: number;
  onRemove: (id: string) => void;
  onDurationChange: (id: string, duration: number) => void;
  onToggleRenderable: (id: string) => void;
}

const typeIcons = {
  image: Image,
  video: Film,
  webpage: Globe,
  interactive: Gamepad2
};

const typeLabels = {
  image: 'Image',
  video: 'Video',
  webpage: 'Webpage',
  interactive: 'Interactive'
};

export function PlaylistItemCard({
  item,
  index,
  onRemove,
  onDurationChange,
  onToggleRenderable
}: PlaylistItemCardProps) {
  const Icon = typeIcons[item.type];
  const canToggleRenderable = item.type === 'image' || item.type === 'video';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`
        flex items-center gap-3 p-3 rounded-xl glass-panel
        ${!item.renderable ? 'border-l-4 border-l-amber-500' : ''}
      `}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Index */}
      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
        {index + 1}
      </div>
      
      {/* Thumbnail / Icon */}
      <div className="w-16 h-12 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden relative">
        {(item.type === 'image' || item.type === 'video') && item.url ? (
          <>
            {item.type === 'image' ? (
              <img 
                src={item.url} 
                alt={item.name} 
                className={`w-full h-full object-cover ${!item.renderable ? 'opacity-50' : ''}`}
              />
            ) : (
              <video 
                src={item.url} 
                className={`w-full h-full object-cover ${!item.renderable ? 'opacity-50' : ''}`}
                muted
              />
            )}
            {!item.renderable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Ban className="w-4 h-4 text-amber-400" />
              </div>
            )}
          </>
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.name}</span>
          {!item.renderable && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              Non-renderable
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Icon className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{typeLabels[item.type]}</span>
        </div>
      </div>
      
      {/* Renderable toggle for images/videos */}
      {canToggleRenderable && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={item.renderable}
                  onCheckedChange={() => onToggleRenderable(item.id)}
                  className="scale-75"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                {item.renderable ? 'Click to exclude from video' : 'Click to include in video'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Duration input */}
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <Input
          type="number"
          min={0.5}
          max={300}
          step={0.5}
          value={item.duration}
          onChange={(e) => onDurationChange(item.id, parseFloat(e.target.value) || 1)}
          className="w-16 h-8 text-xs text-center"
          disabled={item.type === 'video'}
        />
        <span className="text-xs text-muted-foreground">s</span>
      </div>
      
      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
