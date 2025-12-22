import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { UploadZone } from '@/components/UploadZone';
import { VideoCard } from '@/components/VideoCard';
import { PresetSelector } from '@/components/PresetSelector';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Button } from '@/components/ui/button';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';
import { VideoFile, VideoPreset } from '@/types/video';
import { videoPresets } from '@/data/presets';
import { 
  Film, 
  Sparkles, 
  Download, 
  Merge, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';

const Index = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<VideoPreset | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  
  const { 
    isLoaded, 
    isLoading, 
    progress, 
    loadFFmpeg, 
    analyzeVideo, 
    mergeVideos 
  } = useVideoProcessor();

  const handleFilesSelected = useCallback(async (files: FileList) => {
    if (isProcessing) return;
    
    const fileArray = Array.from(files).filter(f => f.type.startsWith('video/'));
    
    if (fileArray.length === 0) {
      toast.error('Please select video files');
      return;
    }
    
    toast.info(`Analyzing ${fileArray.length} video${fileArray.length > 1 ? 's' : ''}...`);
    
    for (const file of fileArray) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const metadata = await analyzeVideo(file);
      
      const videoFile: VideoFile = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        duration: metadata.duration || 0,
        width: metadata.width || 0,
        height: metadata.height || 0,
        codec: metadata.codec || 'Unknown',
        frameRate: metadata.frameRate || 30,
        bitrate: metadata.bitrate || 0,
        thumbnail: metadata.thumbnail || '',
        url: URL.createObjectURL(file),
      };
      
      setVideos(prev => [...prev, videoFile]);
    }
    
    toast.success(`${fileArray.length} video${fileArray.length > 1 ? 's' : ''} added`);
  }, [analyzeVideo, isProcessing]);

  const handleRemoveVideo = useCallback((id: string) => {
    setVideos(prev => {
      const video = prev.find(v => v.id === id);
      if (video) {
        URL.revokeObjectURL(video.url);
      }
      return prev.filter(v => v.id !== id);
    });
  }, []);

  const handleMergeVideos = useCallback(async () => {
    if (videos.length < 2) {
      toast.error('Add at least 2 videos to merge');
      return;
    }
    
    setIsProcessing(true);
    toast.info('Starting video merge...');
    
    try {
      const blob = await mergeVideos(videos, selectedPreset);
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        setMergedVideoUrl(url);
        toast.success('Videos merged successfully!');
      } else {
        toast.error('Failed to merge videos');
      }
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('An error occurred while merging');
    } finally {
      setIsProcessing(false);
    }
  }, [videos, selectedPreset, mergeVideos]);

  const handleDownloadMerged = useCallback(() => {
    if (!mergedVideoUrl) return;
    
    const a = document.createElement('a');
    a.href = mergedVideoUrl;
    a.download = `merged_video_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Download started');
  }, [mergedVideoUrl]);

  const handleLoadProcessor = useCallback(async () => {
    await loadFFmpeg();
    toast.success('Video processor ready');
  }, [loadFFmpeg]);

  const totalDuration = videos.reduce((acc, v) => acc + v.duration, 0);
  const totalSize = videos.reduce((acc, v) => acc + v.size, 0);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen pb-8">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-4xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
              >
                <Film className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold gradient-text">VideoFusion</h1>
                <p className="text-xs text-muted-foreground">Merge • Encode • Create</p>
              </div>
            </div>
            
            {!isLoaded && (
              <Button 
                variant="glass" 
                size="sm"
                onClick={handleLoadProcessor}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? 'Loading...' : 'Initialize'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl pt-6 space-y-6">
        {/* Upload Zone */}
        <UploadZone 
          onFilesSelected={handleFilesSelected} 
          isProcessing={isProcessing}
        />

        {/* Video List */}
        <AnimatePresence>
          {videos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Stats Bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4" />
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    {formatSize(totalSize)}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-muted-foreground"
                >
                  Presets
                  {showPresets ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>

              {/* Presets Panel */}
              <AnimatePresence>
                {showPresets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-panel rounded-2xl p-4">
                      <PresetSelector
                        presets={videoPresets}
                        selectedPreset={selectedPreset}
                        onSelect={setSelectedPreset}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Cards */}
              <div className="space-y-3">
                <AnimatePresence>
                  {videos.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      index={index}
                      onRemove={handleRemoveVideo}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Progress Indicator */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ProgressIndicator progress={progress} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Merged Video Preview */}
              <AnimatePresence>
                {mergedVideoUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel rounded-2xl p-4 space-y-4"
                  >
                    <h3 className="text-lg font-semibold gradient-text">Merged Video</h3>
                    <video
                      src={mergedVideoUrl}
                      controls
                      className="w-full rounded-xl bg-background/50"
                    />
                    <Button
                      variant="glow"
                      className="w-full"
                      onClick={handleDownloadMerged}
                    >
                      <Download className="w-4 h-4" />
                      Download Merged Video
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="glow"
                  size="lg"
                  className="flex-1"
                  onClick={handleMergeVideos}
                  disabled={videos.length < 2 || isProcessing}
                >
                  <Merge className="w-5 h-5" />
                  Merge All Videos
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {videos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Ready to create amazing videos
            </div>
            
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
              {[
                { icon: '📱', label: 'Upload' },
                { icon: '🔍', label: 'Analyze' },
                { icon: '🎬', label: 'Merge' },
              ].map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="glass-panel rounded-xl p-4 text-center"
                >
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="text-sm font-medium text-muted-foreground">{step.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="container max-w-4xl mt-12 text-center text-xs text-muted-foreground/50">
        <p>VideoFusion • Process videos in your browser</p>
      </footer>
    </div>
  );
};

export default Index;
