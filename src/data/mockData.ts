import type { Assignment, MonicaEvent, YoungResearcher } from "../types";

export const youngResearchers: YoungResearcher[] = [
  {
    id: "yr_1",
    name: "Sebastian",
    email: "sebastian@unimeta.edu.co",
    active: true,
    color: "#2563eb",
  },
  {
    id: "yr_2",
    name: "Duvan",
    email: "duvan@unimeta.edu.co",
    active: true,
    color: "#16a34a",
  },
  {
    id: "yr_3",
    name: "Montillo",
    email: "montillo@unimeta.edu.co",
    active: true,
    color: "#9333ea",
  },
  {
    id: "yr_4",
    name: "Michael",
    email: "michael@unimeta.edu.co",
    active: true,
    color: "#ea580c",
  },
  {
    id: "yr_5",
    name: "Jonathan",
    email: "jonathan@unimeta.edu.co",
    active: true,
    color: "#0891b2",
  },
  {
    id: "yr_6",
    name: "Guzman",
    email: "guzman@unimeta.edu.co",
    active: true,
    color: "#be123c",
  },
];

export const monicaEvents: MonicaEvent[] = [
  {
    id: "evt_1",
    googleCalendarEventId: "google_evt_1",
    title: "Día en Unimeta - Instituto Central Superior",
    start: "2026-05-28T08:00:00-05:00",
    end: "2026-05-28T09:00:00-05:00",
    location: "Auditorio Julio Flórez Roa I, UNIMETA",
    modality: "presencial",
    status: "scheduled",
    requiredPeople: 2,
    source: "MONICA_WORKFLOW",
    description: "Visita institucional con estudiantes.",
  },
  {
    id: "evt_2",
    googleCalendarEventId: "google_evt_2",
    title: "Día en Unimeta - Colegio Gimnasio Campestre El Bosque",
    start: "2026-06-02T08:00:00-05:00",
    end: "2026-06-02T09:00:00-05:00",
    location: "Auditorio Julio Flórez Roa I, UNIMETA",
    modality: "presencial",
    status: "scheduled",
    requiredPeople: 2,
    source: "MONICA_WORKFLOW",
    description: "Visita institucional con estudiantes.",
  },
  {
    id: "evt_3",
    googleCalendarEventId: "google_evt_3",
    title: "Día en Unimeta - Institución Educativa Apiay",
    start: "2026-06-05T08:00:00-05:00",
    end: "2026-06-05T09:00:00-05:00",
    location: "Auditorio Julio Flórez Roa I, UNIMETA",
    modality: "presencial",
    status: "needs_review",
    requiredPeople: 2,
    source: "MONICA_WORKFLOW",
    description: "Pendiente revisar disponibilidad de jóvenes.",
  },
];

export const initialAssignments: Assignment[] = [
  {
    id: "asig_1",
    eventId: "evt_1",
    researcherId: "yr_1",
    status: "assigned",
  },
  {
    id: "asig_2",
    eventId: "evt_1",
    researcherId: "yr_2",
    status: "assigned",
  },
  {
    id: "asig_3",
    eventId: "evt_2",
    researcherId: "yr_3",
    status: "assigned",
  },
];