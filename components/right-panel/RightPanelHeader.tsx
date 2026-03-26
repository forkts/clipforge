import { Lock, X } from 'lucide-react';
import { Button } from '../ui/button';

interface RightPanelHeaderProps {
  onClose?: () => void;
}

export const RightPanelHeader = ({ onClose }: RightPanelHeaderProps) => {
  return (
    <div>
      <div className="h-14 flex items-center justify-between px-5 border-b shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="xl:hidden h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </Button>
          )}
          <h2 className="font-semibold text-foreground tracking-wide">Inspector</h2>
        </div>
        <div className="flex gap-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
            title="Lock prop"
          >
            <Lock size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
