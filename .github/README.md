<div align="center">

<img src="public/favicon.ico" width="64" height="64" alt="ClipForge logo" />

# ClipForge

**A browser-based, FFmpeg-powered video editor — no installs, no uploads.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-0.12-007808?logo=ffmpeg)](https://ffmpegwasm.netlify.app)
[![Status](https://img.shields.io/badge/status-in%20development-orange)](#roadmap)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Live Demo](#) · [Report a Bug](https://github.com/arijitchhatui/clipforge/issues) · [Request a Feature](https://github.com/arijitchhatui/clipforge/issues)

</div>

---

## Overview

ClipForge is a **fully client-side, browser-based video editor** built on top of [FFmpeg.wasm](https://ffmpegwasm.netlify.app). All video processing happens locally in your browser using WebAssembly — your files never leave your machine.

> ⚠️ **This project is actively under development.** APIs, features, and the UI are subject to change. Contributions and feedback are very welcome!

---

## Features

### ✅ Currently Available

| Feature | Description |
|---|---|
| **Multi-track Timeline** | Arrange video and audio clips across independent tracks with drag-and-drop reordering |
| **Video Stitching** | Concatenate multiple video clips into a single output using FFmpeg |
| **Audio Stitching** | Merge and layer multiple audio tracks |
| **Trim & Split** | Non-destructive clip trimming and splitting at the playhead position |
| **Frame Extraction** | Extract a specific number of frames or frames at a given FPS from any clip |
| **Sprite Sheet Generation** | Generate sprite sheets from video for scrubbing previews |
| **Audio Waveform Visualization** | Visual waveform rendering in the timeline for audio clips |
| **Audio Mixing** | Per-clip volume control and master volume/mute |
| **Transitions** | 14+ FFmpeg-powered transitions between clips (fade, wipe, slide, crossfade, etc.) |
| **Animations** | Clip-level entrance animations (fade, slide, zoom, spin) |
| **Export to ZIP** | Download extracted frames or processed media as a ZIP archive |
| **Media Library** | Import, browse, and manage your video, audio, and image assets |
| **History Panel** | Session-level action history |
| **Fullscreen Preview** | Dedicated fullscreen viewer with playback controls |
| **Dark / Light Theme** | System-aware theme with manual override |

### 🚧 In Progress / Planned

- [ ] Text overlays & titles
- [ ] Effects & filters library
- [ ] Image-to-video and image overlay support
- [ ] Video comparison view (`/compare` route — scaffolded)
- [ ] Clip-level opacity and transform (scale, position) controls
- [ ] Timeline zoom and virtualized scrolling
- [ ] Undo / redo history
- [ ] Persistent project save/load

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI Library | [React 19](https://react.dev) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Video Processing | [FFmpeg.wasm](https://ffmpegwasm.netlify.app) (`@ffmpeg/ffmpeg`, `@ffmpeg/core`, `@ffmpeg/util`) |
| State Management | [Zustand 5](https://zustand-demo.pmnd.rs) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Component Primitives | [Base UI](https://base-ui.com), [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com) |
| File Handling | [react-dropzone](https://react-dropzone.js.org), [JSZip](https://stuk.github.io/jszip/) |
| Icons | [Lucide React](https://lucide.dev) |
| Carousel | [Embla Carousel](https://www.embla-carousel.com) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Package Manager | [pnpm](https://pnpm.io) |

---

## Project Structure

```
clipforge/
├── app/
│   ├── editor/           # Main editor route & sub-components
│   │   └── components/
│   │       ├── Editor.tsx              # Root editor layout
│   │       ├── EditorLeftPanel.tsx     # Media library panel
│   │       ├── EditorNavigationPanel.tsx
│   │       ├── EditorPreview.tsx       # Video preview canvas
│   │       ├── EditorRightPanel.tsx    # Clip properties & export
│   │       └── EditorTimeline.tsx      # Timeline container
│   └── compare/          # Video comparison view (WIP)
│
├── components/
│   ├── track/            # Timeline track primitives
│   │   ├── TimelineClipView.tsx
│   │   ├── TimelineHeader.tsx
│   │   ├── TimelineRuler.tsx
│   │   ├── TimelineTrack.tsx
│   │   └── TrackSidebar.tsx
│   ├── library/          # Left panel library tabs
│   │   ├── EditorLibrary.tsx
│   │   ├── HistoryLibrary.tsx
│   │   ├── AnimationLibrary.tsx
│   │   ├── TransitionsLibrary.tsx
│   │   ├── EffectsLibrary.tsx
│   │   └── TextLibrary.tsx
│   ├── right-panel/      # Clip properties & export panel
│   │   ├── RightPanelHeader.tsx
│   │   ├── RightPanelActionButtons.tsx
│   │   └── RightPanelExportedMedia.tsx
│   └── ui/               # Shared UI primitives (shadcn)
│
├── hooks/                # Custom React hooks
│   ├── useTimelineHooks.tsx    # Core clip CRUD, split, reorder
│   ├── usePlayBackEngine.tsx   # Synchronized playback engine
│   ├── useZipHook.tsx          # Frame extraction & ZIP export
│   ├── useVideo.tsx
│   ├── useVideoControls.tsx
│   ├── useTimelineFrames.tsx
│   ├── useVisibleRange.tsx
│   ├── useGlobalAudioControls.tsx
│   └── useIsMobile.tsx
│
├── lib/                  # FFmpeg utilities & helpers
│   ├── ffmpeg.ts               # FFmpeg singleton loader
│   ├── stitchVideos.ts         # Multi-clip video concatenation
│   ├── stitchAudios.ts         # Audio track merging
│   ├── trimVideo.ts            # Clip trimming
│   ├── exportVideo.ts          # Final export pipeline
│   ├── generateVideoFrames.ts  # Frame extraction
│   ├── generateFrameAtTime.ts  # Single-frame grab
│   ├── generateSpriteSheet.ts  # Sprite sheet generation
│   ├── generateThumbnail.ts
│   ├── generateVideoMetadata.ts
│   ├── extractAudio.ts
│   ├── extractAudioFrame.ts
│   ├── addAudioToVideo.ts
│   ├── muteVideo.ts
│   ├── audioWaveForm.ts
│   ├── videoFrames.ts          # Frame cache management
│   ├── helpers.ts              # Time/format utilities
│   └── utils.ts
│
└── store/                # Zustand stores
    ├── timeline.store.ts       # Clips, playhead, playback state
    ├── library.store.ts        # Imported media library
    ├── video.store.ts
    ├── audio.store.ts
    └── image.store.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8 — `npm install -g pnpm`

> FFmpeg.wasm requires **SharedArrayBuffer**, which needs specific HTTP headers. The dev server is pre-configured for this. If you deploy elsewhere, ensure your server sets:
> ```
> Cross-Origin-Opener-Policy: same-origin
> Cross-Origin-Embedder-Policy: require-corp
> ```

### Installation

```bash
# Clone the repo
git clone https://github.com/arijitchhatui/clipforge.git
cd clipforge

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

---

## Browser Compatibility

ClipForge requires a modern browser with **WebAssembly** and **SharedArrayBuffer** support.

| Browser | Support |
|---|---|
| Chrome / Edge ≥ 90 | ✅ Full |
| Firefox ≥ 89 | ✅ Full |
| Safari ≥ 15.2 | ⚠️ Partial (SharedArrayBuffer may require flags) |
| Mobile browsers | ⚠️ Limited (performance depends on device) |

---

## Roadmap

See the [open issues](https://github.com/arijitchhatui/clipforge/issues) for a full list of planned features and known bugs.

High-priority milestones:

- `v1.2` — Text overlays, effects/filters library
- `v1.3` — Undo/redo, project persistence (localStorage / IndexedDB)
- `v2.0` — Full transform controls (scale, position, opacity) per clip

---

## Contributing

We welcome contributions of all kinds! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
  Built with ❤️ and <a href="https://ffmpegwasm.netlify.app">FFmpeg.wasm</a>
</div>
