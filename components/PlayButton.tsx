import { Pause, Play } from "lucide-react";
import { Button } from "./ui/button";

interface PlayProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
}

export const PlayButton = ({
  isPlaying,
  onPlayPause,
  className,
}: PlayProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onPlayPause}
      className={className}
    >
      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
    </Button>
  );
};
