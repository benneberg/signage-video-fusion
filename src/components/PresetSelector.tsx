import { motion } from 'framer-motion';
import { VideoPreset } from '@/types/video';
import { Check } from 'lucide-react';

interface PresetSelectorProps {
  presets: VideoPreset[];
  selectedPreset: VideoPreset | null;
  onSelect: (preset: VideoPreset) => void;
}

export function PresetSelector({ presets, selectedPreset, onSelect }: PresetSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 gradient-text">Encoding Presets</h3>
      <div className="grid gap-3">
        {presets.map((preset, index) => (
          <motion.button
            key={preset.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onSelect(preset)}
            className={`preset-card rounded-xl p-4 text-left w-full ${
              selectedPreset?.id === preset.id ? 'selected' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{preset.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{preset.name}</h4>
                  {selectedPreset?.id === preset.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {preset.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {preset.codec}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {preset.resolution}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {preset.frameRate}fps
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
