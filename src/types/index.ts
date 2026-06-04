export type ResearcherStatus = "active" | "inactive";

export type YoungResearcher = {
  id: string;
  name: string;
  email?: string;
  active: boolean;
  color: string;
};

export type ResearcherAvailability =
  | "available"
  | "assigned_to_this_event"
  | "busy"
  | "inactive";

export type ConflictingEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
};

export type ResearcherAvailabilityItem = YoungResearcher & {
  availability: ResearcherAvailability;
  reason?: string;
  conflictingEvent?: ConflictingEvent;
};

export type Assignment = {
  id: string;
  eventId: string;
  researcherId: string;
  status:
    | "assigned"
    | "confirmed"
    | "cancelled"
    | "replaced"
    | "no_show"
    | "completed";
};

export type MonicaEventStatus =
  | "scheduled"
  | "rescheduled"
  | "cancelled"
  | "needs_review"
  | "completed";

export type MonicaEvent = {
  id: string;
  googleCalendarEventId: string;
  title: string;
  start: string;
  end: string;
  location: string;
  modality: "presencial" | "virtual" | "mixta";
  status: MonicaEventStatus;
  requiredPeople: number;
  source: "MONICA_WORKFLOW" | "PANEL" | "GOOGLE_CALENDAR";
  description?: string;
};
