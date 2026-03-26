import { ApplyTheme } from '@/components/ApplyTheme';
import { Logo } from '@/components/Logo';
import { RightPanelExportedMedia } from '@/components/right-panel/RightPanelExportedMedia';
import { Button } from '@/components/ui/button';
import { useZipHook } from '@/hooks/useZipHook';
import { useTimelineStore } from '@/store/timeline.store';
import {
  ArrowLeftRight,
  Download,
  Expand,
  Loader2,
  Menu,
  Redo2,
  Settings,
  Shrink,
  SlidersHorizontal,
  Undo2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface EditorNavigationPanelProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  zip: ReturnType<typeof useZipHook>;
  onExpand: () => unknown;
  isExpanded: boolean;
}

export const EditorNavigationPanel: React.FC<EditorNavigationPanelProps> = ({
  onToggleLeft,
  onToggleRight,
  showLeftPanel,
  showRightPanel,
  zip,
  onExpand,
  isExpanded,
}) => {
  const { clips } = useTimelineStore();
  const { handleAction, exportedMedia, setExportedMedia, isProcessing, handleDownloadAll } = zip;

  const handleExport = async () => {
    if (clips.length === 1) {
      const clip = clips[0];
      await handleAction(clip.file, clip.id, 'none', clip.duration);
      if (exportedMedia) {
        await handleDownloadAll(exportedMedia);
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && !e.shiftKey) {
        onExpand();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onExpand]);

  const currentClip = clips[0];
  return (
    <header className="h-14 bg-background border-b flex items-center justify-between px-2 sm:px-4 shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-2 sm:gap-6">
        <Button variant="ghost" size="icon" onClick={onToggleLeft} className="text-muted-foreground">
          {showLeftPanel ? <X size={20} /> : <Menu size={20} />}
        </Button>
        <Logo />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" onClick={onExpand} className="text-muted-foreground">
          {isExpanded ? <Shrink size={20} /> : <Expand size={20} />}
        </Button>
        <ApplyTheme />

        <div className="flex p-0.5 bg-muted rounded-md border">
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" title="Undo">
            <Undo2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" title="Redo">
            <Redo2 size={16} />
          </Button>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block"></div>

        <Link href="/compare">
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex h-8 w-8 rounded-full text-muted-foreground"
            title="Compare Media"
          >
            <ArrowLeftRight size={16} />
          </Button>
        </Link>

        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex h-8 w-8 rounded-full text-muted-foreground"
          title="Settings"
        >
          <Settings size={16} />
        </Button>

        <Button
          disabled={clips.length !== 1 || isProcessing}
          onClick={handleExport}
          className="group relative px-2 py-1.5 sm:px-4 h-8 rounded-md flex items-center gap-1 sm:gap-2 overflow-hidden border-none text-primary-foreground bg-primary hover:bg-primary/90"
        >
          {isProcessing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} className="relative z-10" />
          )}
          <span className="relative z-10 hidden sm:block text-xs font-semibold">
            {isProcessing ? 'Processing...' : 'Export'}
          </span>
        </Button>

        {exportedMedia && (
          <RightPanelExportedMedia zip={zip} onCancel={() => setExportedMedia(null)} clipId={currentClip?.id} />
        )}
        <Button variant="ghost" size="icon" onClick={onToggleRight} className="ml-1 text-muted-foreground">
          {showRightPanel ? <X size={20} /> : <SlidersHorizontal size={20} />}
        </Button>
      </div>
    </header>
  );
};
