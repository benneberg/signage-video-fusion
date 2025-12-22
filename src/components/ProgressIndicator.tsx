import { motion } from 'framer-motion';
import { ProcessingProgress } from '@/types/video';
import { Loader2, CheckCircle2, AlertCircle, Film, Cog } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: ProcessingProgress;
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const getIcon = () => {
    switch (progress.stage) {
      case 'analyzing':
        return <Film className="w-5 h-5 text-primary animate-pulse" />;
      case 'encoding':
      case 'merging':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Cog className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.stage) {
      case 'complete':
        return 'from-green-500 to-emerald-500';
      case 'error':
        return 'from-destructive to-red-600';
      default:
        return 'from-primary to-secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{progress.message}</p>
          {progress.currentFile && (
            <p className="text-xs text-muted-foreground truncate">
              {progress.currentFile}
            </p>
          )}
        </div>
        <span className="text-sm font-mono text-primary flex-shrink-0">
          {progress.progress}%
        </span>
      </div>
      
      <div className="progress-bar h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${getStatusColor()}`}
        />
      </div>
    </motion.div>
  );
}
