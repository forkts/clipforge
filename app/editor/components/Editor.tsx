'use client';

import { useZipHook } from '@/hooks/useZipHook';
import { useEffect, useRef, useState } from 'react';
import { EditorLeftPanel } from './EditorLeftPanel';
import { EditorNavigationPanel } from './EditorNavigationPanel';
import { EditorPreview } from './EditorPreview';
import { EditorRightPanel } from './EditorRightPanel';
import { EditorTimeline } from './EditorTimeline';

export const Editor = () => {
  const zip = useZipHook();

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const [open, setOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('media');
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);

  useEffect(() => {
    setShowLeftPanel(open);
    setShowRightPanel(open);
    setShowTimeline(open);
  }, [open]);

  return (
    <div className="flex flex-col h-[100dvh] w-full text-foreground bg-background overflow-hidden font-sans selection:bg-primary/30">
      <EditorNavigationPanel
        onToggleLeft={() => setShowLeftPanel(!showLeftPanel)}
        onToggleRight={() => setShowRightPanel(!showRightPanel)}
        showLeftPanel={showLeftPanel}
        showRightPanel={showRightPanel}
        zip={zip}
        onExpand={() => setOpen((prev) => !prev)}
        isExpanded={open}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {showLeftPanel && (
          <div
            className={`
              absolute inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:transform-none
              ${showLeftPanel ? 'translate-x-0' : '-translate-x-full md:hidden'}
            `}
          >
            <EditorLeftPanel activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0 border-x border-border shadow-inner bg-muted/20">
          <EditorPreview videoRefs={videoRefs} audioRefs={audioRefs} />
        </div>

        {showRightPanel && (
          <div
            className={`
              absolute inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:transform-none
              ${showRightPanel ? 'translate-x-0' : 'translate-x-full md:hidden'}
            `}
          >
            <EditorRightPanel
              zip={zip}
              onClose={() => setShowRightPanel(false)}
              videoRefs={videoRefs}
              audioRefs={audioRefs}
            />
          </div>
        )}
      </div>

      {showTimeline && (
        <div className="h-1/3 min-h-[250px] md:h-72 shrink-0 border-t border-border flex flex-col">
          <EditorTimeline
            showTimeline={showTimeline}
            onToggleTimeline={() => setShowTimeline(!showTimeline)}
            videoRefs={videoRefs}
            audioRefs={audioRefs}
          />
        </div>
      )}
    </div>
  );
};
