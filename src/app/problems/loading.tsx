export default function Loading() {
  return (
    <div className="page space-y-5" aria-busy="true" aria-label="Loading problems">
      <div className="skeleton h-10 w-48" /><div className="skeleton h-9 w-60" /><div className="skeleton h-24" />
      <div className="card divide-y divide-line">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex items-center gap-4 px-4 py-4"><div className="skeleton h-6 w-6 rounded-full" /><div className="skeleton h-5 flex-1" /><div className="skeleton h-5 w-20" /></div>)}</div>
    </div>
  );
}
