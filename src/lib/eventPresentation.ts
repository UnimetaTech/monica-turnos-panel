import type {
  Assignment,
  ConflictingEvent,
  MonicaEvent,
  MonicaEventStatus,
  ResearcherAvailability,
} from "../types";

const EVENT_TIME_ZONE = "America/Bogota";

type StatusMeta = {
  label: string;
  calendarColor: string;
  badgeClassName: string;
};

export const EVENT_STATUS_META: Record<MonicaEventStatus, StatusMeta> = {
  scheduled: {
    label: "Programado",
    calendarColor: "#2563eb",
    badgeClassName: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  rescheduled: {
    label: "Reprogramado",
    calendarColor: "#7c3aed",
    badgeClassName: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  cancelled: {
    label: "Cancelado",
    calendarColor: "#ef4444",
    badgeClassName: "bg-red-50 text-red-700 ring-red-200",
  },
  needs_review: {
    label: "Requiere revisión",
    calendarColor: "#f97316",
    badgeClassName: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  completed: {
    label: "Completado",
    calendarColor: "#16a34a",
    badgeClassName: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

export const EVENT_MODALITY_LABELS: Record<MonicaEvent["modality"], string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  mixta: "Mixta",
};

export const EVENT_SOURCE_LABELS: Record<MonicaEvent["source"], string> = {
  GOOGLE_CALENDAR: "Google Calendar",
  MONICA_WORKFLOW: "MONICA",
  PANEL: "Panel operativo",
};

export const ASSIGNMENT_STATUS_LABELS: Record<Assignment["status"], string> = {
  assigned: "Asignado",
  cancelled: "Cancelado",
  completed: "Completado",
  confirmed: "Confirmado",
  no_show: "No asistió",
  replaced: "Reemplazado",
};

export const RESEARCHER_AVAILABILITY_LABELS: Record<
  ResearcherAvailability,
  string
> = {
  available: "Disponible",
  assigned_to_this_event: "Ya asignado",
  busy: "Ocupado",
  inactive: "Inactivo",
};

const eventDateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  year: "numeric",
});

const eventTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: EVENT_TIME_ZONE,
});

function parseEventDate(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatEventTimeRange(start: string, end: string): string {
  const startDate = parseEventDate(start);
  const endDate = parseEventDate(end);

  if (!startDate || !endDate) {
    return "Horario por confirmar";
  }

  return `${eventDateFormatter.format(startDate)} · ${eventTimeFormatter.format(
    startDate
  )} - ${eventTimeFormatter.format(endDate)}`;
}

export function formatEventTimeOnlyRange(start: string, end: string): string {
  const startDate = parseEventDate(start);
  const endDate = parseEventDate(end);

  if (!startDate || !endDate) {
    return "horario por confirmar";
  }

  return `${eventTimeFormatter.format(startDate)} - ${eventTimeFormatter.format(
    endDate
  )}`;
}

export function formatConflictingEventMessage(
  conflictingEvent: ConflictingEvent
): string {
  return `Ocupado en “${conflictingEvent.title}” de ${formatEventTimeOnlyRange(
    conflictingEvent.start,
    conflictingEvent.end
  )}.`;
}

export function getCoverageLabel(
  assignedCount: number,
  requiredPeople: number
): string {
  if (requiredPeople <= 0) {
    return `${assignedCount} asignado${assignedCount === 1 ? "" : "s"}`;
  }

  if (assignedCount === 0) {
    return `Sin cobertura · faltan ${requiredPeople}`;
  }

  if (assignedCount < requiredPeople) {
    return `Faltan ${requiredPeople - assignedCount}`;
  }

  if (assignedCount === requiredPeople) {
    return "Cobertura completa";
  }

  return `Sobrecupo +${assignedCount - requiredPeople}`;
}

export function getCoverageClassName(
  assignedCount: number,
  requiredPeople: number
): string {
  if (requiredPeople <= 0 || assignedCount >= requiredPeople) {
    return "text-emerald-700";
  }

  if (assignedCount === 0) {
    return "text-red-700";
  }

  return "text-orange-700";
}

export function getCoveragePercentage(
  assignedCount: number,
  requiredPeople: number
): number {
  if (requiredPeople <= 0) {
    return 100;
  }

  return Math.min(100, Math.round((assignedCount / requiredPeople) * 100));
}
