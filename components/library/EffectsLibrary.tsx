import { AssetGrid } from '@/components/AssetGrid';
import { effects } from '@/lib/utils';

export const EffectsLibrary = () => <AssetGrid assets={effects} onSelect={(a) => console.log('Effect:', a)} />;
