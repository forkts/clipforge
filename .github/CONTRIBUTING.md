# Contributing to ClipForge

Thank you for your interest in contributing to ClipForge! 🎬  
This document walks you through everything you need to get started.

> ClipForge is actively in development. The codebase is evolving quickly, so please check [open issues](https://github.com/arijitchhatui/clipforge/issues) before starting work on anything large.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [FFmpeg.wasm Notes](#ffmpegwasm-notes)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

By contributing, you agree to be respectful and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) — harassment, discrimination, or hostile behaviour of any kind will not be tolerated.

---

## Ways to Contribute

| Type | Description |
|---|---|
| 🐛 Bug Fix | Fix a reported issue |
| ✨ Feature | Implement an item from the roadmap or a new idea |
| 📖 Docs | Improve README, CONTRIBUTING, or inline comments |
| 🎨 UI/UX | Improve the editor's look, feel, or accessibility |
| ⚡ Perf | Optimize FFmpeg operations, frame caching, or rendering |
| 🧪 Tests | Add test coverage for hooks, utilities, or FFmpeg wrappers |
| 🔍 Review | Review open pull requests |

If you're unsure where to start, look for issues tagged [`good first issue`](https://github.com/arijitchhatui/clipforge/issues?q=is%3Aissue+label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/arijitchhatui/clipforge/issues?q=is%3Aissue+label%3A%22help+wanted%22).

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8

```bash
npm install -g pnpm
```

### Steps

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/clipforge.git
cd clipforge

# 2. Install dependencies
pnpm install

# 3. Start the dev server
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

> **Important:** FFmpeg.wasm requires `SharedArrayBuffer`, which needs specific security headers. These are already configured in `next.config.ts`. Do not remove them.

### Linting

```bash
pnpm lint
```

The project uses ESLint with the Next.js config. Make sure there are no lint errors before opening a PR.

---

## Project Architecture

Understanding the structure will help you contribute in the right place.

```
clipforge/
├── app/editor/        → Route & top-level editor panels (layout, panels)
├── components/
│   ├── track/         → Timeline primitives (clips, ruler, header, sidebar)
│   ├── library/       → Left-panel library tabs
│   ├── right-panel/   → Right-panel clip properties & export controls
│   └── ui/            → Shared UI primitives (shadcn-based)
├── hooks/             → All custom React hooks (playback, timeline CRUD, ZIP export)
├── lib/               → All FFmpeg operation wrappers + time/format helpers
└── store/             → Zustand state stores (timeline, library, video, audio, image)
```

### Key design decisions

- **All FFmpeg logic lives in `lib/`** — one function per operation (e.g., `trimVideo.ts`, `stitchVideos.ts`). Keep these pure and free of React.
- **Hooks orchestrate the stores** — `useTimelineHooks.tsx` wires FFmpeg calls to Zustand store actions. Prefer hooks over putting logic directly in components.
- **Stores are flat** — each media type has its own store (`video.store.ts`, `audio.store.ts`, etc.) and the central `timeline.store.ts` holds the combined clip timeline.
- **No server-side processing** — ClipForge is 100% client-side. Do not add server actions, API routes, or any backend that handles user media.

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, deployable code |
| `dev` | Integration branch — PRs target this |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Refactors, deps, config changes |
| `docs/<name>` | Documentation only |

**Always branch off `dev`**, not `main`.

```bash
git checkout dev
git pull upstream dev
git checkout -b feat/text-overlays
```

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Build tooling, dependencies, config |
| `refactor` | Code restructuring without behaviour change |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or updating tests |

### Scopes (examples)

`timeline`, `ffmpeg`, `playback`, `library`, `export`, `ui`, `store`, `hooks`

### Examples

```
feat(timeline): add clip split at playhead
fix(ffmpeg): handle missing codec in stitchVideos
perf(frames): cache generated sprite sheets by clip id
docs: update README with browser compatibility table
chore(deps): upgrade framer-motion to v12.38.0
```

---

## Pull Request Process

1. **Open an issue first** for any non-trivial change. This prevents duplicate work and aligns everyone on the approach before code is written.
2. **Fork & branch** off `dev` using the naming convention above.
3. **Keep PRs focused** — one feature or fix per PR. Large PRs are hard to review and slow to merge.
4. **Write a clear PR description** including:
   - What the change does
   - Why it's needed / which issue it closes (`Closes #<issue>`)
   - Screenshots or a short screen recording for UI changes
5. **Ensure linting passes** (`pnpm lint`).
6. **Do not commit build artifacts** (`.next/`, `node_modules/`, etc.). These are already in `.gitignore`.
7. **Request a review** from a maintainer. Respond to feedback promptly.
8. A maintainer will squash-merge your PR into `dev` once approved.

### PR Checklist

```
- [ ] Branched off `dev`
- [ ] Follows commit convention
- [ ] No lint errors (`pnpm lint`)
- [ ] No new console errors / warnings in the browser
- [ ] UI changes include a screenshot or recording
- [ ] Linked to a related issue (if applicable)
- [ ] No server-side media processing added
```

---

## Coding Guidelines

### TypeScript

- Always type props explicitly — avoid `any`.
- Prefer `interface` for object shapes and `type` for unions/aliases.
- Export types alongside the component/function that owns them.

### React & Hooks

- Keep components focused. If a component exceeds ~150 lines, consider splitting it.
- Extract reusable logic into hooks (`hooks/`) rather than repeating it across components.
- Avoid large `useEffect` blocks — break them into smaller, named hooks.
- Use `useRef` for video/audio element refs; do not store DOM nodes in Zustand.

### State Management (Zustand)

- Each store covers a single domain. Do not add cross-domain logic to a store.
- Business logic (FFmpeg calls, side effects) belongs in hooks, not stores.
- Use the `enqueue` helper from `timeline.store.ts` when chaining async FFmpeg operations to prevent race conditions.

### FFmpeg Utilities (`lib/`)

- **One file per operation** (e.g., `trimVideo.ts`, `muteVideo.ts`).
- Functions should be `async`, return the processed `Uint8Array` or `File`, and throw on FFmpeg errors.
- Always call `ffmpeg.deleteFile()` for any temp files created during processing to avoid memory leaks.
- Do not import React or Zustand inside `lib/` files — keep them framework-agnostic.

### Styling

- Use Tailwind CSS utility classes. Avoid inline styles.
- Follow the existing design tokens (`bg-background`, `text-foreground`, `border-border`, etc.) — do not hardcode colours.
- Responsive behaviour: use `md:` breakpoints. The editor has a mobile-aware layout.

---

## FFmpeg.wasm Notes

FFmpeg.wasm runs FFmpeg inside a Web Worker via WebAssembly. A few things to keep in mind:

- **Single instance** — The FFmpeg instance is a singleton (`lib/ffmpeg.ts`). Loading it multiple times causes issues. Always import the shared instance.
- **File system is in-memory** — All files are written to FFmpeg's virtual FS (`ffmpeg.writeFile()`), processed, and read back (`ffmpeg.readFile()`). Clean up temp files after use.
- **SharedArrayBuffer** — Required for multi-threaded FFmpeg. The `next.config.ts` already adds the necessary COOP/COEP headers; do not remove them.
- **Large files** — Processing large videos in the browser is memory-intensive. Be mindful of what you load into the FFmpeg FS at once.
- **Codec support** — `@ffmpeg/core` ships a subset of FFmpeg codecs. Check compatibility before adding new operations.

---

## Reporting Bugs

Before filing a bug, please:

1. Search [existing issues](https://github.com/arijitchhatui/clipforge/issues) to avoid duplicates.
2. Reproduce the issue in a clean browser session (clear cache, disable extensions).
3. Note your browser + version and OS.

When filing, include:
- **Steps to reproduce** (as specific as possible)
- **Expected behaviour**
- **Actual behaviour**
- **Browser console errors** (open DevTools → Console)
- A **screen recording** or screenshot if applicable

---

## Requesting Features

Open a [Feature Request issue](https://github.com/arijitchhatui/clipforge/issues/new) and describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternative approaches you considered

Feature requests that align with the [roadmap](README.md#roadmap) will be prioritised.

---

## Questions?

Open a [Discussion](https://github.com/arijitchhatui/clipforge/discussions) or drop a comment on the relevant issue. We're happy to help!

---

<div align="center">
  Thank you for helping make ClipForge better 🚀
</div>
