export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <span className="font-bold sm:text-lg tracking-tight hidden sm:block">
        ClipForge
      </span>
    </div>
  );
};
