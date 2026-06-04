import type { YoungResearcher } from "../types";

type Props = {
  researchers: YoungResearcher[];
};

export function ResearcherSidebar({ researchers }: Props) {
  const activeResearchers = researchers.filter((researcher) => researcher.active);

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Equipo operativo
        </p>
        <h2 className="mt-1 text-base font-bold text-slate-950">
          Jóvenes investigadores
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Seleccioná un evento del calendario y asigná el equipo desde el
          detalle operativo.
        </p>
      </div>

      <div className="mb-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Estado administrativo
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-950">
          {activeResearchers.length}/{researchers.length}
        </p>
        <p className="text-xs text-slate-500">
          habilitados en el equipo, no libres por horario
        </p>
      </div>

      <div className="space-y-3">
        {researchers.map((researcher) => (
          <div
            key={researcher.id}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: researcher.color }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {researcher.name}
                </p>
                {researcher.email && (
                  <p className="truncate text-xs text-slate-500">
                    {researcher.email}
                  </p>
                )}
              </div>

              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  researcher.active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {researcher.active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
