import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageFrameCard } from '@/components/ImageFrameCard';
import { SimpleProgress } from '@/components/SimpleProgress';
import { useImageVideoProcessor } from '@/hooks/useImageVideoProcessor';
import { ImageFrame, ImageVideoSettings } from '@/types/image-video';
import { 
  Image, 
  Play, 
  Download, 
  Trash2, 
  Settings,
  Film
} from 'lucide-react';

const ImageToVideo = () => {
  const [frames, setFrames] = useState<ImageFrame[]>([]);
  const [settings, setSettings] = useState<ImageVideoSettings>({
    resolution: '1920x1080',
    fps: 30,
    defaultDuration: 3,
    padColor: '#000000',
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { renderVideo, isRecording, progress, status, canvasRef } = useImageVideoProcessor();

  const uid = () => Math.random().toString(36).slice(2, 9);

  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    });

    if (fileArray.length === 0) {
      toast.error('Please select image files (JPG, PNG, WebP, GIF)');
      return;
    }

    const newFrames: ImageFrame[] = fileArray.map(file => ({
      id: uid(),
      file,
      name: file.name,
      duration: settings.defaultDuration,
      url: URL.createObjectURL(file),
    }));

    setFrames(prev => [...prev, ...newFrames]);
    toast.success(`${fileArray.length} image${fileArray.length > 1 ? 's' : ''} added`);
  }, [settings.defaultDuration]);

  const handleDurationChange = useCallback((id: string, duration: number) => {
    setFrames(prev => prev.map(f => 
      f.id === id ? { ...f, duration } : f
    ));
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    setFrames(prev => {
      const index = prev.findIndex(f => f.id === id);
      if (index === -1) return prev;
      const copy = { ...prev[index], id: uid() };
      const newFrames = [...prev];
      newFrames.splice(index + 1, 0, copy);
      return newFrames;
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFrames(prev => {
      const frame = prev.find(f => f.id === id);
      if (frame) {
        URL.revokeObjectURL(frame.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const handleClear = useCallback(() => {
    frames.forEach(f => URL.revokeObjectURL(f.url));
    setFrames([]);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    toast.info('Cleared all images');
  }, [frames, videoUrl]);

  const handleRender = useCallback(async () => {
    if (frames.length === 0) {
      toast.error('Add at least one image');
      return;
    }

    toast.info('Starting video render...');
    
    const blob = await renderVideo(frames, settings);
    
    if (blob) {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      toast.success('Video rendered successfully!');
    } else {
      toast.error('Failed to render video');
    }
  }, [frames, settings, renderVideo, videoUrl]);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `slideshow-${new Date().toISOString().slice(0, 19).replace('T', '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Download started');
  }, [videoUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  }, [handleFilesSelected]);

  const totalDuration = frames.reduce((acc, f) => acc + f.duration, 0);

  return (
    <AppLayout>
      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="upload-zone glass-panel relative flex flex-col items-center justify-center min-h-[180px] rounded-2xl cursor-pointer transition-all duration-300"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            className="hidden"
            disabled={isRecording}
          />
          
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3"
          >
            <Image className="w-7 h-7 text-primary" />
          </motion.div>
          
          <p className="text-base font-medium text-foreground mb-1">
            Drop images or tap to upload
          </p>
          <p className="text-sm text-muted-foreground">
            JPG, PNG, WebP, GIF supported
          </p>
        </label>
      </motion.div>

      {/* Settings Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Image className="w-4 h-4" />
            {frames.length} image{frames.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Play className="w-4 h-4" />
            {totalDuration.toFixed(1)}s
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-muted-foreground"
        >
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select
                    value={settings.resolution}
                    onValueChange={(value) => setSettings(s => ({ ...s, resolution: value }))}
                  >
                    <SelectTrigger id="resolution" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1920x1080">1920 × 1080</SelectItem>
                      <SelectItem value="1280x720">1280 × 720</SelectItem>
                      <SelectItem value="1080x1920">1080 × 1920 (portrait)</SelectItem>
                      <SelectItem value="720x1280">720 × 1280 (portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="fps">FPS</Label>
                  <Input
                    id="fps"
                    type="number"
                    min={1}
                    max={60}
                    value={settings.fps}
                    onChange={(e) => setSettings(s => ({ ...s, fps: parseInt(e.target.value) || 30 }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="defaultDuration">Default Duration (sec)</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={settings.defaultDuration}
                    onChange={(e) => setSettings(s => ({ ...s, defaultDuration: parseFloat(e.target.value) || 3 }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="padColor">Padding Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="padColor"
                      type="color"
                      value={settings.padColor}
                      onChange={(e) => setSettings(s => ({ ...s, padColor: e.target.value }))}
                      className="w-14 h-9 p-1 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground font-mono">{settings.padColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Frames List */}
      <AnimatePresence>
        {frames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {frames.map((frame, index) => (
              <ImageFrameCard
                key={frame.id}
                frame={frame}
                index={index}
                onDurationChange={handleDurationChange}
                onDuplicate={handleDuplicate}
                onRemove={handleRemove}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SimpleProgress 
              progress={progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0} 
              message={status}
            />
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview */}
      <AnimatePresence>
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-2xl p-4 space-y-4"
          >
            <h3 className="text-lg font-semibold gradient-text flex items-center gap-2">
              <Film className="w-5 h-5" />
              Generated Video
            </h3>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-xl bg-background/50"
            />
            <Button
              variant="glow"
              className="w-full"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
              Download WebM
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Note: Output is WebM format. Convert to MP4 if needed for compatibility.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {frames.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="glow"
            size="lg"
            className="flex-1"
            onClick={handleRender}
            disabled={frames.length === 0 || isRecording}
          >
            <Play className="w-5 h-5" />
            Render Video
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleClear}
            disabled={isRecording}
          >
            <Trash2 className="w-5 h-5" />
            Clear All
          </Button>
        </div>
      )}

      {/* Empty State */}
      {frames.length === 0 && !videoUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <p className="text-sm text-muted-foreground">
            Upload images to create a timed slideshow video
          </p>
        </motion.div>
      )}
    </AppLayout>
  );
};

export default ImageToVideo;
