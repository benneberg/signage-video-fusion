import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SimpleProgressProps {
  progress: number;
  message?: string;
}

export function SimpleProgress({ progress, message }: SimpleProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {message || 'Processing...'}
          </p>
        </div>
        <span className="text-sm font-mono text-primary flex-shrink-0">
          {progress}%
        </span>
      </div>
      
      <div className="progress-bar h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
        />
      </div>
    </motion.div>
  );
}
