import type {
  Assignment,
  MonicaEvent,
  ResearcherAvailability,
  ResearcherAvailabilityItem,
} from "../types";
import {
  ASSIGNMENT_STATUS_LABELS,
  EVENT_MODALITY_LABELS,
  EVENT_SOURCE_LABELS,
  EVENT_STATUS_META,
  RESEARCHER_AVAILABILITY_LABELS,
  formatConflictingEventMessage,
  formatEventTimeRange,
  getCoverageClassName,
  getCoverageLabel,
  getCoveragePercentage,
} from "../lib/eventPresentation";

type Props = {
  selectedEvent: MonicaEvent | null;
  isOpen: boolean;
  assignments: Assignment[];
  researcherAvailability: ResearcherAvailabilityItem[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  onAssignResearcher: (eventId: string, researcherId: string) => void;
  onRemoveResearcher: (assignmentId: string) => void;
  onClose: () => void;
};

const AVAILABILITY_ORDER: Record<ResearcherAvailability, number> = {
  available: 1,
  assigned_to_this_event: 2,
  busy: 3,
  inactive: 4,
};

function getAvailabilityActionLabel(
  availability: ResearcherAvailability
): string {
  if (availability === "available") return "Asignar";
  if (availability === "assigned_to_this_event") return "Ya asignado";
  if (availability === "busy") return "Ocupado";
  return "Inactivo";
}

function getAvailabilityDescription(
  researcher: ResearcherAvailabilityItem
): string {
  if (researcher.availability === "busy" && researcher.conflictingEvent) {
    return formatConflictingEventMessage(researcher.conflictingEvent);
  }

  if (researcher.reason) {
    return researcher.reason;
  }

  if (researcher.availability === "available") {
    return "Disponible para este evento.";
  }

  if (researcher.availability === "assigned_to_this_event") {
    return "Ya está asignado a este evento.";
  }

  if (researcher.availability === "inactive") {
    return "Joven investigador inactivo.";
  }

  return "No disponible para este horario.";
}

function getAvailabilityBadgeClassName(
  availability: ResearcherAvailability
): string {
  if (availability === "available") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (availability === "assigned_to_this_event") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (availability === "busy") {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function EventDetailPanel({
  selectedEvent,
  isOpen,
  assignments,
  researcherAvailability,
  availabilityLoading,
  availabilityError,
  onAssignResearcher,
  onRemoveResearcher,
  onClose,
}: Props) {
  if (!selectedEvent || !isOpen) {
    return null;
  }

  const eventAssignments = assignments.filter(
    (assignment) => assignment.eventId === selectedEvent.id
  );

  const assignmentByResearcherId = new Map(
    eventAssignments.map((assignment) => [assignment.researcherId, assignment])
  );

  const sortedResearcherAvailability = [...researcherAvailability].sort(
    (first, second) =>
      AVAILABILITY_ORDER[first.availability] -
        AVAILABILITY_ORDER[second.availability] ||
      first.name.localeCompare(second.name)
  );

  const assignedResearchers = sortedResearcherAvailability.filter(
    (researcher) => researcher.availability === "assigned_to_this_event"
  );

  const availableCount = researcherAvailability.filter(
    (researcher) => researcher.availability === "available"
  ).length;
  const assignedCount =
    researcherAvailability.length > 0
      ? assignedResearchers.length
      : eventAssignments.length;
  const coveragePercentage = getCoveragePercentage(
    assignedCount,
    selectedEvent.requiredPeople
  );
  const coverageLabel = getCoverageLabel(
    assignedCount,
    selectedEvent.requiredPeople
  );
  const coverageClassName = getCoverageClassName(
    assignedCount,
    selectedEvent.requiredPeople
  );
  const statusMeta = EVENT_STATUS_META[selectedEvent.status];

  return (
    <aside className="w-full border-t border-slate-200 bg-white shadow-xl lg:w-[28rem] lg:border-l lg:border-t-0">
      <div className="flex h-full max-h-[45vh] flex-col overflow-y-auto p-4 lg:max-h-none">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Evento seleccionado
            </p>
            <h2 className="text-lg font-bold text-slate-950">
              Detalle operativo
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          >
            Ocultar
          </button>
        </div>

        <details
          open
          className="group rounded-2xl border border-slate-200 bg-slate-50"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resumen del evento
              </p>
              <h3 className="mt-1 text-base font-bold leading-snug text-slate-950">
                {selectedEvent.title}
              </h3>
            </div>

            <span
              aria-hidden="true"
              className="mt-1 rounded-full bg-white px-2 py-1 text-xs text-slate-500 transition group-open:rotate-180"
            >
              ↓
            </span>
          </summary>

          <div className="border-t border-slate-200 px-4 pb-4 pt-3">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Fecha y hora</dt>
                <dd className="mt-1 text-slate-900">
                  {formatEventTimeRange(selectedEvent.start, selectedEvent.end)}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-500">Ubicación</dt>
                <dd className="mt-1 text-slate-900">
                  {selectedEvent.location || "Ubicación por confirmar"}
                </dd>
              </div>

              {selectedEvent.description && (
                <div>
                  <dt className="font-semibold text-slate-500">Descripción</dt>
                  <dd className="mt-1 text-slate-900">
                    {selectedEvent.description}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {EVENT_MODALITY_LABELS[selectedEvent.modality]}
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                Requiere {selectedEvent.requiredPeople}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusMeta.badgeClassName}`}
              >
                {statusMeta.label}
              </span>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {EVENT_SOURCE_LABELS[selectedEvent.source]}
              </span>
            </div>
          </div>
        </details>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950">
                Cobertura del turno
              </h3>
              <p className={`mt-1 text-xs font-semibold ${coverageClassName}`}>
                {coverageLabel}
              </p>
            </div>

            <p className="text-sm font-bold text-slate-900">
              {assignedCount}/{selectedEvent.requiredPeople}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${coveragePercentage}%` }}
            />
          </div>
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-bold text-slate-950">
            Jóvenes asignados
          </h3>

          <div className="mt-3 space-y-2">
            {assignedResearchers.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                Todavía no hay jóvenes asignados a este evento.
              </p>
            )}

            {assignedResearchers.map((researcher) => {
              const assignment = assignmentByResearcherId.get(researcher.id);

              return (
                <div
                  key={researcher.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: researcher.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {researcher.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Estado:{" "}
                        {assignment
                          ? ASSIGNMENT_STATUS_LABELS[assignment.status]
                          : "Asignado"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!assignment}
                    onClick={() =>
                      assignment && onRemoveResearcher(assignment.id)
                    }
                    className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                  >
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 pb-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-950">
              Disponibilidad operativa
            </h3>
            <span className="text-xs text-slate-500">
              {availableCount} disponible{availableCount === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            La disponibilidad se calcula para este evento. El estado{" "}
            <strong>Activo/Inactivo</strong> pertenece al perfil del joven y no
            se modifica al asignar.
          </p>

          {availabilityError && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {availabilityError}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {availabilityLoading && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                Cargando disponibilidad...
              </p>
            )}

            {!availabilityLoading &&
              !availabilityError &&
              sortedResearcherAvailability.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                  No hay datos de disponibilidad para este evento.
                </p>
              )}

            {!availabilityLoading &&
              sortedResearcherAvailability.map((researcher) => {
                const canAssign = researcher.availability === "available";
                const description = getAvailabilityDescription(researcher);

                return (
                  <div
                    key={researcher.id}
                    className="rounded-xl border border-slate-200 p-3"
                    title={!canAssign ? description : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: researcher.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {researcher.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${getAvailabilityBadgeClassName(
                          researcher.availability
                        )}`}
                      >
                        {RESEARCHER_AVAILABILITY_LABELS[
                          researcher.availability
                        ]}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canAssign}
                      onClick={() =>
                        onAssignResearcher(selectedEvent.id, researcher.id)
                      }
                      className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold transition enabled:hover:border-blue-200 enabled:hover:bg-blue-50 enabled:hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {getAvailabilityActionLabel(researcher.availability)}
                    </button>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </aside>
  );
}
