import type {
  Assignment,
  ConflictingEvent,
  MonicaEvent,
  ResearcherAvailability,
  ResearcherAvailabilityItem,
  YoungResearcher,
} from "../types";

const DEFAULT_API_URL = "http://localhost:8080";
const INVALID_API_URL_VALUES = new Set(["", "undefined", "null"]);
const rawApiUrl = import.meta.env.VITE_API_URL;
const normalizedApiUrl = typeof rawApiUrl === "string" ? rawApiUrl.trim() : "";

const API_URL =
  !INVALID_API_URL_VALUES.has(normalizedApiUrl.toLowerCase())
    ? normalizedApiUrl.replace(/\/+$/, "")
    : DEFAULT_API_URL;

if (import.meta.env.DEV) {
  console.log("[MONICA API] VITE_API_URL:", rawApiUrl);
  console.log("[MONICA API] API_URL:", API_URL);
}

const API_LOG_PREFIX = "[MONICA API]";
const RESPONSE_PREVIEW_LENGTH = 500;
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

type ParsedJson =
  | {
      body: unknown;
      ok: true;
    }
  | {
      error: unknown;
      ok: false;
    };

type RequestDiagnostics = {
  apiBase: string;
  method: string;
  path: string;
  requestUrl: string;
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

function parseJson(text: string): ParsedJson {
  if (!text) {
    return { body: null, ok: true };
  }

  try {
    return { body: JSON.parse(text), ok: true };
  } catch (error) {
    return { error, ok: false };
  }
}

function getRequestUrl(path: string): string {
  return `${API_URL}${path}`;
}

function getResponsePreview(text: string): string {
  return text.length > RESPONSE_PREVIEW_LENGTH
    ? `${text.slice(0, RESPONSE_PREVIEW_LENGTH)}...`
    : text;
}

function getRequestDiagnostics(
  path: string,
  options?: RequestInit
): RequestDiagnostics {
  const requestUrl = getRequestUrl(path);

  return {
    apiBase: API_URL,
    method: options?.method || "GET",
    path,
    requestUrl,
  };
}

function logApiNetworkError(error: unknown, details: RequestDiagnostics): void {
  console.error(`${API_LOG_PREFIX} Network error`, {
    ...details,
    error,
  });
}

function logApiHttpError(
  response: Response,
  body: unknown,
  details: RequestDiagnostics
): void {
  console.error(`${API_LOG_PREFIX} HTTP error`, {
    ...details,
    body,
    status: response.status,
    statusText: response.statusText,
  });
}

function logApiInvalidJsonResponse(
  response: Response,
  responseText: string,
  parseError: unknown,
  details: RequestDiagnostics
): void {
  console.error(`${API_LOG_PREFIX} Invalid JSON response`, {
    ...details,
    contentType: response.headers.get("Content-Type"),
    parseError,
    responsePreview: getResponsePreview(responseText),
    status: response.status,
    statusText: response.statusText,
  });
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const details = getRequestDiagnostics(path, options);
  let response: Response;

  try {
    response = await fetch(getRequestUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
  } catch (error) {
    logApiNetworkError(error, details);
    throw error;
  }

  const responseText = await response.text();
  const parsedJson = parseJson(responseText);
  const body = parsedJson.ok
    ? parsedJson.body
    : { rawText: getResponsePreview(responseText) };

  if (!response.ok) {
    logApiHttpError(response, body, details);
    throw new ApiError(getErrorMessage(body), response.status, body);
  }

  if (!parsedJson.ok) {
    logApiInvalidJsonResponse(response, responseText, parsedJson.error, details);
    throw new ApiError(
      "El backend no respondió con JSON válido.",
      response.status,
      body
    );
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
