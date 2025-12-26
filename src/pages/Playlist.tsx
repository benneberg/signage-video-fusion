import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Image, 
  Film, 
  Globe, 
  Gamepad2,
  Play,
  Download,
  FileJson,
  Trash2,
  Settings2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlaylistItemCard } from '@/components/PlaylistItemCard';
import { SegmentVisualizer } from '@/components/SegmentVisualizer';
import { SimpleProgress } from '@/components/SimpleProgress';
import { usePlaylistProcessor } from '@/hooks/usePlaylistProcessor';
import { 
  PlaylistItem, 
  PlaylistSettings, 
  PlaylistSchema,
  RenderedSegment,
  ImagePlaylistItem,
  VideoPlaylistItem,
  WebpagePlaylistItem,
  InteractivePlaylistItem
} from '@/types/playlist';

const resolutionOptions = [
  { value: '1920x1080', label: '1080p (1920×1080)' },
  { value: '1280x720', label: '720p (1280×720)' },
  { value: '854x480', label: '480p (854×480)' },
  { value: '640x360', label: '360p (640×360)' },
];

const fpsOptions = [
  { value: 24, label: '24 fps' },
  { value: 30, label: '30 fps' },
  { value: 60, label: '60 fps' },
];

export default function Playlist() {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [settings, setSettings] = useState<PlaylistSettings>({
    resolution: '1920x1080',
    fps: 30,
    defaultImageDuration: 5,
    padColor: '#000000'
  });
  const [renderedSegments, setRenderedSegments] = useState<RenderedSegment[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [addUrlDialog, setAddUrlDialog] = useState<{ open: boolean; type: 'webpage' | 'interactive' | null }>({ 
    open: false, 
    type: null 
  });
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    analyzePlaylist, 
    renderPlaylist, 
    isProcessing, 
    progress, 
    canvasRef,
    abort,
    reset
  } = usePlaylistProcessor();
  
  const analysis = useMemo(() => {
    if (items.length === 0) return null;
    return analyzePlaylist(items);
  }, [items, analyzePlaylist]);
  
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const newItems: PlaylistItem[] = [];
    
    for (const file of Array.from(files)) {
      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const url = URL.createObjectURL(file);
      
      if (file.type.startsWith('image/')) {
        newItems.push({
          id,
          name: file.name,
          type: 'image',
          order: items.length + newItems.length,
          renderable: true,
          file,
          url,
          duration: settings.defaultImageDuration
        } as ImagePlaylistItem);
      } else if (file.type.startsWith('video/')) {
        // Get video duration
        const duration = await getVideoDuration(url);
        newItems.push({
          id,
          name: file.name,
          type: 'video',
          order: items.length + newItems.length,
          renderable: true,
          file,
          url,
          duration
        } as VideoPlaylistItem);
      }
    }
    
    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} item(s)`);
    }
  }, [items.length, settings.defaultImageDuration]);
  
  const addNonRenderableItem = useCallback((type: 'webpage' | 'interactive') => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    const newItem: WebpagePlaylistItem | InteractivePlaylistItem = {
      id,
      name: nameInput.trim() || urlInput,
      type,
      order: items.length,
      renderable: false,
      url: urlInput,
      duration: 30
    };
    
    setItems(prev => [...prev, newItem]);
    setAddUrlDialog({ open: false, type: null });
    setUrlInput('');
    setNameInput('');
    toast.success(`Added ${type} item`);
  }, [urlInput, nameInput, items.length]);
  
  const handleRemoveItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item && (item.type === 'image' || item.type === 'video') && item.url) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);
  
  const handleDurationChange = useCallback((id: string, duration: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, duration: Math.max(0.5, duration) } : item
    ));
  }, []);
  
  const handleToggleRenderable = useCallback((id: string) => {
    setItems(prev => prev.map(item => {
      // Only allow toggling for image/video types
      if (item.id === id && (item.type === 'image' || item.type === 'video')) {
        return { ...item, renderable: !item.renderable } as typeof item;
      }
      return item;
    }));
  }, []);
  
  const handleReorder = useCallback((reordered: PlaylistItem[]) => {
    setItems(reordered.map((item, idx) => ({ ...item, order: idx })));
  }, []);
  
  const handleRender = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Add items to the playlist first');
      return;
    }
    
    const results = await renderPlaylist(items, settings);
    setRenderedSegments(results);
    
    if (results.length > 0) {
      toast.success(`Rendered ${results.length} video segment(s)`);
    } else {
      toast.error('Rendering failed');
    }
  }, [items, settings, renderPlaylist]);
  
  const handleDownload = useCallback((segment: RenderedSegment) => {
    const url = URL.createObjectURL(segment.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = segment.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);
  
  const handleExportJson = useCallback(() => {
    const schema: PlaylistSchema = {
      version: '1.0',
      name: 'Playlist Export',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        order: item.order,
        renderable: item.renderable,
        url: item.url,
        duration: item.duration,
        sourceType: (item.type === 'image' || item.type === 'video') && (item as any).file ? 'file' : 'url',
        filename: (item as any).file?.name
      }))
    };
    
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playlist.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Playlist exported');
  }, [items, settings]);
  
  const handleImportJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const schema = JSON.parse(event.target?.result as string) as PlaylistSchema;
        
        if (schema.version !== '1.0') {
          toast.error('Unsupported playlist version');
          return;
        }
        
        setSettings(schema.settings);
        
        // Import items (note: files need to be re-uploaded separately)
        const importedItems: PlaylistItem[] = schema.items
          .filter(item => item.sourceType === 'url' || !item.renderable)
          .map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            order: item.order,
            renderable: item.renderable,
            url: item.url,
            duration: item.duration
          } as PlaylistItem));
        
        setItems(importedItems);
        
        const fileItems = schema.items.filter(i => i.sourceType === 'file');
        if (fileItems.length > 0) {
          toast.info(`${fileItems.length} file(s) need to be re-uploaded`);
        } else {
          toast.success('Playlist imported');
        }
      } catch (err) {
        toast.error('Invalid playlist file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);
  
  const handleClearAll = useCallback(() => {
    items.forEach(item => {
      if ((item.type === 'image' || item.type === 'video') && item.url) {
        URL.revokeObjectURL(item.url);
      }
    });
    setItems([]);
    setRenderedSegments([]);
    reset();
    toast.success('Playlist cleared');
  }, [items, reset]);
  
  return (
    <AppLayout>
      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        type="file"
        accept=".json"
        className="hidden"
        id="json-import"
        onChange={handleImportJson}
      />
      
      {/* Header actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddUrlDialog({ open: true, type: 'webpage' })}>
                <Globe className="w-4 h-4 mr-2" />
                Add Webpage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddUrlDialog({ open: true, type: 'interactive' })}>
                <Gamepad2 className="w-4 h-4 mr-2" />
                Add Interactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportJson}
            disabled={items.length === 0}
          >
            <FileJson className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => document.getElementById('json-import')?.click()}
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          {items.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>
      
      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Resolution</Label>
                <Select
                  value={settings.resolution}
                  onValueChange={(v) => setSettings(s => ({ ...s, resolution: v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Frame Rate</Label>
                <Select
                  value={settings.fps.toString()}
                  onValueChange={(v) => setSettings(s => ({ ...s, fps: parseInt(v) }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fpsOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Default Duration</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.defaultImageDuration}
                  onChange={(e) => setSettings(s => ({ ...s, defaultImageDuration: parseInt(e.target.value) || 5 }))}
                  className="h-9"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Pad Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.padColor}
                    onChange={(e) => setSettings(s => ({ ...s, padColor: e.target.value }))}
                    className="h-9 w-12 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={settings.padColor}
                    onChange={(e) => setSettings(s => ({ ...s, padColor: e.target.value }))}
                    className="h-9 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Empty state */}
      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel rounded-xl p-12 text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">Create Your Playlist</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add images, videos, or non-renderable items like webpages
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="glass" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Image className="w-4 h-4 mr-2" />
              Add Images
            </Button>
            <Button variant="glass" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Film className="w-4 h-4 mr-2" />
              Add Videos
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Playlist items */}
      {items.length > 0 && (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="cursor-default"
              >
                <PlaylistItemCard
                  item={item}
                  index={index}
                  onRemove={handleRemoveItem}
                  onDurationChange={handleDurationChange}
                  onToggleRenderable={handleToggleRenderable}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
      
      {/* Segment analysis */}
      <SegmentVisualizer analysis={analysis} />
      
      {/* Render controls */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-4 space-y-4"
        >
          {isProcessing ? (
            <>
              <SimpleProgress 
                progress={progress.percent || 0}
                message={progress.message}
              />
              <Button variant="destructive" size="sm" onClick={abort}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleRender}
              className="w-full gap-2"
              disabled={!analysis || analysis.segments.length === 0}
            >
              <Play className="w-4 h-4" />
              Render {analysis?.segments.length || 0} Segment{(analysis?.segments.length || 0) !== 1 ? 's' : ''}
            </Button>
          )}
        </motion.div>
      )}
      
      {/* Rendered outputs */}
      {renderedSegments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-4 space-y-4"
        >
          <h3 className="font-medium text-sm">Rendered Segments</h3>
          <div className="grid gap-3">
            {renderedSegments.map((segment) => (
              <div
                key={segment.segmentId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Film className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{segment.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {(segment.blob.size / 1024 / 1024).toFixed(2)} MB • {segment.duration.toFixed(1)}s
                    </p>
                  </div>
                </div>
                <Button 
                  variant="glass" 
                  size="sm"
                  onClick={() => handleDownload(segment)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Add URL Dialog */}
      <Dialog 
        open={addUrlDialog.open} 
        onOpenChange={(open) => setAddUrlDialog({ open, type: open ? addUrlDialog.type : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {addUrlDialog.type === 'webpage' ? 'Webpage' : 'Interactive Content'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Display name"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button 
              onClick={() => addUrlDialog.type && addNonRenderableItem(addUrlDialog.type)}
              className="w-full"
            >
              Add to Playlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Helper
function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration || 10);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => resolve(10);
    video.src = url;
  });
}
