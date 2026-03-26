'use client';

import { DropZone } from '@/components/DropZone';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDuration, handleGenerateContentInfo } from '@/lib/helpers';
import { FileType } from '@/lib/utils';
import { LibraryContents, useLibraryStore } from '@/store/library.store';
import { ArrowLeft, ArrowLeftRight, Check, FileVideo, Info, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ComparePage() {
  const { library, setLibrary } = useLibraryStore();
  const videoClips = library.filter((item) => item.type === FileType.Video);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  const selectedVideos = videoClips.filter((v) => selectedIds.includes(v.id));

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/editor">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} /> Back to Editor
            </Button>
          </Link>
          <div className="h-6 w-px bg-border mx-2" />
          <Logo />
        </div>
        <div className="text-sm font-medium text-muted-foreground italic">
          Select up to 4 videos to compare their technical specifications
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Library Selection */}
        <aside className="w-80 border-r bg-muted/30 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <FileVideo size={18} className="text-primary" />
              Library Videos
            </h2>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {videoClips.length}
            </span>
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="grid gap-2">
              {videoClips.map((video) => (
                <div
                  key={video.id}
                  onClick={() => toggleSelection(video.id)}
                  className={`
                    p-3 rounded-xl border transition-all cursor-pointer group relative overflow-hidden
                    ${
                      selectedIds.includes(video.id)
                        ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                        : 'bg-card hover:border-primary/50 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex gap-3 relative z-10">
                    <div className="w-16 h-10 rounded bg-muted overflow-hidden shrink-0 border border-border/50">
                      <video src={video.url} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                        {video.file.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{formatDuration(video.duration || 0)}</span>
                        <span>•</span>
                        <span>{formatSize(video.size || 0)}</span>
                      </div>
                    </div>
                    <div
                      className={`
                      shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-all
                      ${
                        selectedIds.includes(video.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-muted-foreground/30 opacity-0 group-hover:opacity-100'
                      }
                    `}
                    >
                      {selectedIds.includes(video.id) && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              ))}
              {videoClips.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Info size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No videos in your library yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content: Comparison View */}
        <main className="flex-1 bg-muted/10 p-8 overflow-auto">
          {selectedVideos.length > 0 ? (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                  Technical Comparison
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="h-8 gap-2 border-dashed"
                >
                  <X size={14} /> Clear All
                </Button>
              </div>

              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: `repeat(${selectedVideos.length}, minmax(0, 1fr))` }}
              >
                {selectedVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="overflow-hidden border-2 border-primary/5 hover:border-primary/20 transition-all shadow-lg hover:shadow-primary/5"
                  >
                    <div className="aspect-video relative bg-black group">
                      <video src={video.url} controls className="w-full h-full object-contain" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        Preview
                      </div>
                    </div>
                    <CardHeader className="p-4 bg-muted/30">
                      <CardTitle className="text-sm truncate" title={video.file.name}>
                        {video.file.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              Duration
                            </TableHead>
                            <TableCell className="text-xs font-mono">{formatDuration(video.duration || 0)}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              Resolution
                            </TableHead>
                            <TableCell className="text-xs font-mono">
                              {video.video?.width}x{video.video?.height}
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              FPS
                            </TableHead>
                            <TableCell className="text-xs font-mono">{video.video?.fps}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              Frame Count
                            </TableHead>
                            <TableCell className="text-xs font-mono">
                              {video.totalFrames || ((video.duration || 0) * (video.video?.fps || 30)).toFixed(0)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              File Size
                            </TableHead>
                            <TableCell className="text-xs font-mono">{formatSize(video.size || 0)}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              Format
                            </TableHead>
                            <TableCell className="text-xs font-mono truncate">{video.format}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              Codec
                            </TableHead>
                            <TableCell className="text-xs font-mono">{video.video?.codec}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent border-b-0">
                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground/50 h-8">
                              Bitrate
                            </TableHead>
                            <TableCell className="text-xs font-mono">
                              {((video.bitrate || 0) / 1000).toFixed(0)} kb/s
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Advanced Comparison Table */}
              <Card className="border-none shadow-2xl bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/10">
                  <CardTitle className="text-lg">Detailed Specifications</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-1/4">Feature</TableHead>
                        {selectedVideos.map((v) => (
                          <TableHead key={v.id} className="text-center font-bold px-4">
                            {v.file.name.split('.')[0]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold text-xs border-r bg-muted/5">Color Space</TableCell>
                        {selectedVideos.map((v) => (
                          <TableCell key={v.id} className="text-center text-xs font-mono">
                            {v.video?.colorSpace || 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold text-xs border-r bg-muted/5">Pixel Format</TableCell>
                        {selectedVideos.map((v) => (
                          <TableCell key={v.id} className="text-center text-xs font-mono">
                            {v.video?.pixelFormat || 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold text-xs border-r bg-muted/5">Aspect Ratio</TableCell>
                        {selectedVideos.map((v) => (
                          <TableCell key={v.id} className="text-center text-xs font-mono">
                            {v.video?.aspectRatio || 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold text-xs border-r bg-muted/5">Audio Codec</TableCell>
                        {selectedVideos.map((v) => (
                          <TableCell key={v.id} className="text-center text-xs font-mono">
                            {v.audio?.codec || 'No Audio'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold text-xs border-r bg-muted/5">Audio Bitrate</TableCell>
                        {selectedVideos.map((v) => (
                          <TableCell key={v.id} className="text-center text-xs font-mono">
                            {v.audio?.bitrate ? `${(v.audio.bitrate / 1000).toFixed(0)} kb/s` : 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-700">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/10 animate-ping rounded-full" />
                <ArrowLeftRight size={48} className="text-primary relative" />
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-2xl font-bold tracking-tight">Ready to Compare?</h2>
                <DropZone
                  onUpload={async (uploads) => {
                    const processed = await handleGenerateContentInfo(uploads);
                    setLibrary((p) => [...p, ...processed] as LibraryContents[]);
                  }}
                />
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Select videos from your library on the left to start a side-by-side technical comparison. You can
                  compare up to 4 videos at once.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
