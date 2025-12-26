import { RenderableSegment, PlaylistAnalysis } from '@/types/playlist';
import { motion } from 'framer-motion';
import { Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SegmentVisualizerProps {
  analysis: PlaylistAnalysis | null;
}

export function SegmentVisualizer({ analysis }: SegmentVisualizerProps) {
  if (!analysis) return null;
  
  const totalDuration = analysis.segments.reduce((sum, s) => sum + s.totalDuration, 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Playlist Analysis</h3>
        </div>
        
        {analysis.canRenderSingleVideo ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Single video output
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            {analysis.segments.length} segment{analysis.segments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* Timeline visualization */}
      <div className="relative h-12 rounded-lg bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 flex">
          {analysis.segments.map((segment, idx) => {
            const widthPercent = totalDuration > 0 
              ? (segment.totalDuration / totalDuration) * 100 
              : 100 / analysis.segments.length;
            
            // Calculate left position based on previous segments
            let leftPercent = 0;
            for (let i = 0; i < idx; i++) {
              leftPercent += totalDuration > 0 
                ? (analysis.segments[i].totalDuration / totalDuration) * 100
                : 100 / analysis.segments.length;
            }
            
            return (
              <motion.div
                key={segment.id}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: idx * 0.1 }}
                style={{ 
                  width: `${widthPercent}%`,
                  left: `${leftPercent}%`
                }}
                className={`
                  absolute h-full flex items-center justify-center
                  ${idx % 2 === 0 ? 'bg-primary/30' : 'bg-secondary/30'}
                  border-r border-background/50 last:border-r-0
                `}
              >
                <span className="text-xs font-medium text-foreground/80">
                  S{idx + 1}
                </span>
              </motion.div>
            );
          })}
        </div>
        
        {/* Non-renderable markers */}
        {analysis.nonRenderableItems.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 flex gap-0.5">
            {analysis.nonRenderableItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex-1 bg-amber-500/50 rounded-t"
                title={`Non-renderable: ${item.name}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Segment details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {analysis.segments.map((segment, idx) => (
          <div
            key={segment.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs"
          >
            <span className="font-medium">Segment {idx + 1}</span>
            <span className="text-muted-foreground">
              {segment.items.length} items • {segment.totalDuration.toFixed(1)}s
            </span>
          </div>
        ))}
      </div>
      
      {analysis.nonRenderableItems.length > 0 && (
        <p className="text-xs text-amber-400/80">
          ⚠ {analysis.nonRenderableItems.length} non-renderable item(s) will split the timeline
        </p>
      )}
    </motion.div>
  );
}
