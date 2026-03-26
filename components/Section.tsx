"use client";

export const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
);
