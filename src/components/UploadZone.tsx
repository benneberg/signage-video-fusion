import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Film, Plus } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFilesSelected, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  }, [onFilesSelected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          upload-zone glass-panel relative flex flex-col items-center justify-center 
          min-h-[200px] md:min-h-[280px] rounded-2xl cursor-pointer
          transition-all duration-300 overflow-hidden
          ${isDragging ? 'dragging scale-[1.02]' : ''}
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center"
              >
                <Plus className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-xl font-medium text-primary">Drop videos here</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 p-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
                >
                  <Upload className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl -z-10"
                />
              </div>
              
              <div className="text-center">
                <p className="text-lg md:text-xl font-medium text-foreground mb-1">
                  Drop videos or tap to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports MP4, MOV, WebM, and more
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <Film className="w-4 h-4" />
                <span>Multiple files supported</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
    </motion.div>
  );
}
