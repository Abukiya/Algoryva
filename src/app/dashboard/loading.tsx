export default function Loading() {
  return (
    <div className="page space-y-6" aria-busy="true" aria-label="Loading your dashboard">
      <div className="skeleton h-12 w-80 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6"><div className="skeleton h-56 rounded-[1.5rem]" /><div className="skeleton h-40" /><div className="skeleton h-56" /></div>
        <div className="space-y-6"><div className="skeleton h-48" /><div className="skeleton h-64" /></div>
      </div>
    </div>
  );
}
