import { AssetGrid } from '@/components/AssetGrid';
import { transitions } from '@/lib/utils';

export const TransitionLibrary = () => (
  <AssetGrid assets={transitions} onSelect={(a) => console.log('Transition:', a)} />
);
