import { AssetGrid } from '@/components/AssetGrid';
import { animations } from '@/lib/utils';

export const AnimationLibrary = () => <AssetGrid assets={animations} onSelect={(a) => console.log('Animation:', a)} />;
