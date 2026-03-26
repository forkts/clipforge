import { Button } from '@/components/ui/button';
import { EditorAsset } from '@/lib/utils';

interface Props {
  assets: EditorAsset[];
  onSelect?: (asset: EditorAsset) => void;
}

export const AssetGrid: React.FC<Props> = ({ assets, onSelect }) => {
  if (!assets.length) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
        No assets available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {assets.map((asset) => (
        <div
          key={asset.id}
          onClick={() => onSelect?.(asset)}
          className="aspect-video bg-muted rounded-lg border hover:border-primary cursor-pointer p-3 flex flex-col justify-between group"
        >
          <p className="text-xs font-medium">{asset.name}</p>

          <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            Add
          </Button>
        </div>
      ))}
    </div>
  );
};
