import type {
  Assignment,
  ConflictingEvent,
  MonicaEvent,
  ResearcherAvailability,
  ResearcherAvailabilityItem,
  YoungResearcher,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL;
const REPLACEMENT_CHARACTER = "\uFFFD";

const KNOWN_API_TEXT_REPAIRS: Array<[RegExp, string]> = [
  [new RegExp(`D${REPLACEMENT_CHARACTER}a`, "g"), "Día"],
  [new RegExp(`Fl${REPLACEMENT_CHARACTER}rez`, "g"), "Flórez"],
  [new RegExp(`conexi${REPLACEMENT_CHARACTER}n`, "g"), "conexión"],
];

type BackendResearcher = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  color: string;
};

type BackendConflictingEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
};

type BackendResearcherAvailability = BackendResearcher & {
  availability: ResearcherAvailability;
  reason?: string | null;
  conflicting_event?: BackendConflictingEvent | null;
};

type BackendEvent = {
  id: string;
  google_calendar_event_id: string | null;
  title: string;
  start_at: string;
  end_at: string;
  location: string;
  modality: "presencial" | "virtual" | "mixta";
  status: MonicaEvent["status"];
  required_people: number;
  source: MonicaEvent["source"];
  description?: string | null;
};

type BackendAssignment = {
  id: string;
  event_id: string;
  young_researcher_id: string;
  status: Assignment["status"];
};

export type AssignmentConflict = {
  error: string;
  conflictingEvent?: ConflictingEvent;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function repairKnownApiText(value: string | null | undefined): string {
  const text = value || "";

  if (!text.includes(REPLACEMENT_CHARACTER)) {
    return text;
  }

  return KNOWN_API_TEXT_REPAIRS.reduce(
    (currentText, [pattern, replacement]) =>
      currentText.replace(pattern, replacement),
    text
  );
}

function mapResearcher(item: BackendResearcher): YoungResearcher {
  return {
    id: item.id,
    name: repairKnownApiText(item.name),
    email: item.email,
    active: item.active,
    color: item.color,
  };
}

function mapConflictingEvent(
  item: BackendConflictingEvent | null | undefined
): ConflictingEvent | undefined {
  if (!item) {
    return undefined;
  }

  return {
    id: item.id,
    title: repairKnownApiText(item.title),
    start: item.start_at,
    end: item.end_at,
  };
}

function mapResearcherAvailability(
  item: BackendResearcherAvailability
): ResearcherAvailabilityItem {
  return {
    ...mapResearcher(item),
    availability: item.availability,
    reason: item.reason ? repairKnownApiText(item.reason) : undefined,
    conflictingEvent: mapConflictingEvent(item.conflicting_event),
  };
}

function mapEvent(item: BackendEvent): MonicaEvent {
  return {
    id: item.id,
    googleCalendarEventId: item.google_calendar_event_id || "",
    title: repairKnownApiText(item.title),
    start: item.start_at,
    end: item.end_at,
    location: repairKnownApiText(item.location),
    modality: item.modality,
    status: item.status,
    requiredPeople: item.required_people,
    source: item.source,
    description: repairKnownApiText(item.description),
  };
}

function mapAssignment(item: BackendAssignment): Assignment {
  return {
    id: item.id,
    eventId: item.event_id,
    researcherId: item.young_researcher_id,
    status: item.status,
  };
}

function getErrorMessage(body: unknown): string {
  if (isRecord(body) && typeof body.error === "string") {
    return repairKnownApiText(body.error);
  }

  return "No se pudo completar la solicitud.";
}

function parseJson(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const body = parseJson(await response.text());

  if (!response.ok) {
    throw new ApiError(getErrorMessage(body), response.status, body);
  }

  return body as T;
}

export function getAssignmentConflict(
  error: unknown
): AssignmentConflict | null {
  if (!isApiError(error) || error.status !== 409 || !isRecord(error.body)) {
    return null;
  }

  const rawConflict = error.body.conflicting_event;
  const conflictingEvent = isRecord(rawConflict)
    ? mapConflictingEvent({
        id: String(rawConflict.id || ""),
        title: String(rawConflict.title || ""),
        start_at: String(rawConflict.start_at || ""),
        end_at: String(rawConflict.end_at || ""),
      })
    : undefined;

  return {
    error: getErrorMessage(error.body),
    conflictingEvent,
  };
}

export async function getResearchers(): Promise<YoungResearcher[]> {
  const data = await request<BackendResearcher[]>("/api/researchers");
  return data.map(mapResearcher);
}

export async function getEvents(): Promise<MonicaEvent[]> {
  const data = await request<BackendEvent[]>("/api/events");
  return data.map(mapEvent);
}

export async function getAssignments(): Promise<Assignment[]> {
  const data = await request<BackendAssignment[]>("/api/assignments");
  return data.map(mapAssignment);
}

export async function getEventResearcherAvailability(
  eventId: string
): Promise<ResearcherAvailabilityItem[]> {
  const data = await request<BackendResearcherAvailability[]>(
    `/api/events/${eventId}/researchers/availability`
  );

  return data.map(mapResearcherAvailability);
}

export async function updateEventTime(
  eventId: string,
  start: string,
  end: string
): Promise<MonicaEvent> {
  const data = await request<BackendEvent>(`/api/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({
      start_at: start,
      end_at: end,
      status: "rescheduled",
      changed_by: "Faidy",
    }),
  });

  return mapEvent(data);
}

export async function createAssignment(
  eventId: string,
  researcherId: string
): Promise<Assignment> {
  const data = await request<BackendAssignment>(
    `/api/events/${eventId}/assignments`,
    {
      method: "POST",
      body: JSON.stringify({
        young_researcher_id: researcherId,
        assigned_by: "Faidy",
        source: "PANEL",
      }),
    }
  );

  return mapAssignment(data);
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await request(`/api/assignments/${assignmentId}`, {
    method: "DELETE",
  });
}
