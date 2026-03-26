import { DropZone } from '@/components/DropZone';
import { Button } from '@/components/ui/button';
import { handleGenerateContentInfo } from '@/lib/helpers';
import { cn, FileType, tabs } from '@/lib/utils';
import { LibraryContents, useLibraryStore } from '@/store/library.store';
import React, { useState } from 'react';

import { Carousel } from '@/components/Carousel';
import { HistoryLibrary } from '@/components/library/HistoryLibrary';
import { X } from 'lucide-react';
import { AnimationLibrary } from '../../../components/library/AnimationLibrary';
import { EditorLibrary } from '../../../components/library/EditorLibrary';
import { EffectsLibrary } from '../../../components/library/EffectsLibrary';
import { TextLibrary } from '../../../components/library/TextLibrary';
import { TransitionLibrary } from '../../../components/library/TransitionsLibrary';

const EmptyState = ({ label }: { label: string }) => (
  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-xl">
    No {label} found
  </div>
);

interface LeftPanelProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
  onClose?: () => void;
}

export const EditorLeftPanel = React.memo(({ activeTab, setActiveTab }: LeftPanelProps) => {
  const { library, setLibrary, editedLibrary } = useLibraryStore();
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);

  console.log('left panel re-rendered');

  const renderMedia = (items: LibraryContents[], type: 'library' | 'edited' | 'audio') =>
    items.length === 0 ? (
      <EmptyState label={type} />
    ) : (
      <div className="grid grid-cols-1 gap-3">
        {items.map((item, index) => {
          return type === 'library' || type === 'audio' ? (
            <EditorLibrary key={item.id} item={item} index={index} onViewCarousel={setCarouselIndex} />
          ) : (
            <HistoryLibrary key={item.id} item={item} index={index} onViewCarousel={setCarouselIndex} />
          );
        })}
      </div>
    );

  return (
    <div className="flex h-full w-80 border-r bg-background">
      <div className="w-16 flex flex-col items-center py-4 gap-2 border-r overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'h-10 w-10 rounded-xl transition-all',
                activeTab === tab.id ? 'shadow-lg shadow-primary/20' : 'text-muted-foreground',
              )}
            >
              <Icon size={20} />
            </Button>
          );
        })}
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {activeTab === 'media' && (
          <>
            <DropZone
              onUpload={async (uploads) => {
                const processed = await handleGenerateContentInfo(uploads);
                setLibrary((p) => [...p, ...processed] as LibraryContents[]);
              }}
            />
            {renderMedia(library, 'library')}
          </>
        )}

        {activeTab === 'edited' && renderMedia(editedLibrary, 'edited')}

        {activeTab === 'audio' &&
          renderMedia(
            library.filter((i) => i.type === FileType.Audio),
            'audio',
          )}

        {activeTab === 'transitions' && <TransitionLibrary />}
        {activeTab === 'effects' && <EffectsLibrary />}
        {activeTab === 'text' && <TextLibrary />}
        {activeTab === 'animations' && <AnimationLibrary />}
      </div>

      {carouselIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 m-0 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 z-[150]"
            onClick={() => setCarouselIndex(null)}
          >
            <X size={32} />
          </Button>
          <div className="w-full h-full max-w-7xl max-h-[85vh] relative flex items-center justify-center">
            <Carousel
              items={library}
              initialIndex={carouselIndex}
              getKey={(item) => item.id}
              getUrl={(item) => item.url}
              getFileType={(item) => item.type}
              className="w-full h-full"
              urls={library.map((i) => i.url)}
            />
          </div>
        </div>
      )}
    </div>
  );
});
EditorLeftPanel.displayName = 'EditorLeftPanel';
