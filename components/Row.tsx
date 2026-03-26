"use client";

export const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between text-xs bg-muted/30 px-2 py-1 rounded">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground truncate max-w-[140px] text-right">
      {value ?? "-"}
    </span>
  </div>
);
