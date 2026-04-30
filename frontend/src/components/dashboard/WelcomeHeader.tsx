interface WelcomeHeaderProps {
  userName?: string;
}

export function WelcomeHeader({ userName = "Alex" }: WelcomeHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gs-text">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-sm text-gs-muted">
          Here&apos;s what&apos;s happening with your programs today.
        </p>
      </div>

      <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
        <span className="w-2 h-2 rounded-full bg-gs-green shrink-0" />
        <span className="text-sm font-medium text-gs-text">
          Regulatory Core:{" "}
          <span className="text-gs-green">Active</span>
        </span>
      </div>
    </div>
  );
}
