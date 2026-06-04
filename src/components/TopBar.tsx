export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
          </svg>
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-950">
            MONICA Turnos
          </h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            Asignación de jóvenes investigadores para eventos institucionales
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Operación activa
      </div>
    </header>
  );
}
