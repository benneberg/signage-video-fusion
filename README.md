# Deterministic Playlist Compiler for Digital Signage

A browser-based tool for compiling heterogeneous media playlists into gapless, deterministic video outputs. Built to simplify digital signage playback by treating playlists as renderable timelines rather than runtime orchestration problems.

## The Problem

Most digital signage systems treat playback as a runtime orchestration problem: a playlist of heterogeneous media items (images, videos, web pages, feeds) that must be sequenced, timed, and synchronized during playback. This introduces unnecessary complexity and failure modes—gaps, ordering issues, buffering delays, codec mismatches—especially for content that is static, scheduled, and repeatable.

Yet the majority of signage content is exactly that: **deterministic and predictable**.

## The Solution

If most signage content is deterministic, it should be possible—and preferable—to treat a playlist as a renderable timeline and compile it into one or more gapless videos ahead of time. Runtime playback then becomes trivial, reliable, and platform-agnostic.

## Features

### 🎬 Video Merger
- Merge multiple video files into a single output
- Browser-based FFmpeg processing
- Progress tracking and segment visualization

### 🖼️ Image to Video
- Convert images with configurable durations into video
- Customizable resolution, FPS, and padding
- Multiple aspect ratio presets (16:9, 9:16, 4:3, 1:1)
- Ken Burns effect support

### 📋 Playlist Compiler
- Create mixed-media playlists (images, videos, webpages, interactive content)
- Drag-and-drop reordering
- Automatic segmentation at non-renderable items
- Mark items as non-renderable to control segment boundaries
- JSON import/export for persistence and automation
- Renders contiguous sections into gapless MP4 videos

## How It Works

The system behaves like a compiler:

1. **Input**: Heterogeneous media + intent (durations, order, settings)
2. **Intermediate Representation**: Deterministic timeline with identified renderable segments
3. **Output**: Optimized, gapless video artifacts

When the entire playlist is renderable, the output is a single video. When non-renderable items exist (webpages, interactive content), the system produces multiple section videos that can be played sequentially around live content.

## Key Insight

This approach decisively outperforms classic playlist playback when content is:
- ✅ Deterministic
- ✅ Scheduled  
- ✅ Repeatable

It only defers to classic playlists when content must remain live, conditional, or interactive—cases that are real but represent a minority.

**The exception should not define the rule.**

## Tech Stack

- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **FFmpeg.wasm** - Browser-based video processing
- **Framer Motion** - Animations

## Getting Started

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Playlist Schema

Playlists use a JSON schema for import/export:

```json
{
  "version": "1.0",
  "name": "My Playlist",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "settings": {
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30,
    "defaultImageDuration": 5,
    "padding": "letterbox"
  },
  "items": [
    {
      "id": "unique-id",
      "type": "image",
      "name": "slide.jpg",
      "duration": 5,
      "isRenderable": true,
      "order": 0
    }
  ]
}
```

## Use Cases

- **Digital signage networks** - Pre-compile content for reliable playback
- **Retail displays** - Scheduled promotional content
- **Information kiosks** - Mixed static and interactive content
- **Event displays** - Timed presentations with video breaks

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
