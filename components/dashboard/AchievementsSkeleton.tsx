export default function AchievementsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-16 shimmer rounded border border-white/5"
          data-testid="skeleton-cell"
        />
      ))}
    </div>
  );
}
