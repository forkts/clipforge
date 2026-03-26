import { AssetGrid } from '@/components/AssetGrid';
import { textStyles } from '@/lib/utils';

export const TextLibrary = () => <AssetGrid assets={textStyles} onSelect={(a) => console.log('Text:', a)} />;
