import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPanel } from "./components/CalendarPanel";
import { EventDetailPanel } from "./components/EventDetailPanel";
import { ResearcherSidebar } from "./components/ResearcherSidebar";
import { TopBar } from "./components/TopBar";
import type {
  Assignment,
  MonicaEvent,
  ResearcherAvailabilityItem,
  YoungResearcher,
} from "./types";
import { formatConflictingEventMessage } from "./lib/eventPresentation";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentConflict,
  getAssignments,
  getEventResearcherAvailability,
  getEvents,
  getResearchers,
  updateEventTime,
} from "./services/turnosApi";

type Notification = {
  kind: "error" | "success";
  text: string;
};

type NotificationToastProps = {
  notification: Notification;
  onClose: () => void;
};

function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps) {
  const isError = notification.kind === "error";

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-md">
      <div
        className={`pointer-events-auto rounded-2xl border p-4 text-sm shadow-2xl ${
          isError
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              isError ? "bg-red-500" : "bg-emerald-500"
            }`}
          />

          <p className="min-w-0 flex-1 leading-5">{notification.text}</p>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold hover:bg-white/70"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [events, setEvents] = useState<MonicaEvent[]>([]);
  const [researchers, setResearchers] = useState<YoungResearcher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [researcherAvailability, setResearcherAvailability] = useState<
    ResearcherAvailabilityItem[]
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<MonicaEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const [notification, setNotification] = useState<Notification | null>(null);
  const availabilityRequestId = useRef(0);

  const loadResearcherAvailability = useCallback(async (eventId: string) => {
    const currentRequestId = availabilityRequestId.current + 1;
    availabilityRequestId.current = currentRequestId;
    setAvailabilityLoading(true);
    setAvailabilityError(null);

    try {
      const data = await getEventResearcherAvailability(eventId);

      if (currentRequestId !== availabilityRequestId.current) return;

      setResearcherAvailability(data);
    } catch {
      if (currentRequestId !== availabilityRequestId.current) return;

      setResearcherAvailability([]);
      setAvailabilityError(
        "No se pudo cargar la disponibilidad operativa para este evento."
      );
    } finally {
      if (currentRequestId === availabilityRequestId.current) {
        setAvailabilityLoading(false);
      }
    }
  }, []);

  const refreshEventAssignmentsAndAvailability = useCallback(
    async (eventId: string) => {
      const assignmentsData = await getAssignments();
      setAssignments(assignmentsData);

      await loadResearcherAvailability(eventId);
    },
    [loadResearcherAvailability]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [eventsData, researchersData, assignmentsData] =
          await Promise.all([getEvents(), getResearchers(), getAssignments()]);

        if (!isMounted) return;

        setEvents(eventsData);
        setResearchers(researchersData);
        setAssignments(assignmentsData);
        setNotification(null);
      } catch {
        if (!isMounted) return;

        setNotification({
          kind: "error",
          text: "No se pudo cargar la información del panel. Volvé a intentar en unos segundos.",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => {
      setNotification(null);
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notification]);

  function handleSelectEvent(event: MonicaEvent) {
    setResearcherAvailability([]);
    setAvailabilityError(null);
    setSelectedEvent(event);
    setIsDetailOpen(true);
    void loadResearcherAvailability(event.id);
  }

  function handleCloseDetail() {
    availabilityRequestId.current += 1;
    setIsDetailOpen(false);
    setResearcherAvailability([]);
    setAvailabilityError(null);
  }

  async function handleMoveEvent(eventId: string, start: string, end: string) {
    const previousEvents = events;

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              start,
              end,
              status: "rescheduled",
              source: "PANEL",
            }
          : event
      )
    );

    try {
      const updatedEvent = await updateEventTime(eventId, start, end);

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId ? updatedEvent : event
        )
      );

      setSelectedEvent((currentEvent) =>
        currentEvent?.id === eventId ? updatedEvent : currentEvent
      );

      if (selectedEvent?.id === eventId && isDetailOpen) {
        await loadResearcherAvailability(eventId);
      }

      setNotification({
        kind: "success",
        text: "Horario actualizado correctamente.",
      });
    } catch {
      setEvents(previousEvents);
      setNotification({
        kind: "error",
        text: "No se pudo actualizar el horario del evento.",
      });
    }
  }

  async function handleAssignResearcher(eventId: string, researcherId: string) {
    try {
      await createAssignment(eventId, researcherId);
      await refreshEventAssignmentsAndAvailability(eventId);

      setNotification({
        kind: "success",
        text: "Joven investigador asignado correctamente.",
      });
    } catch (error) {
      const conflict = getAssignmentConflict(error);

      if (conflict) {
        await loadResearcherAvailability(eventId);
        setNotification({
          kind: "error",
          text: conflict.conflictingEvent
            ? `${conflict.error} ${formatConflictingEventMessage(
                conflict.conflictingEvent
              )}`
            : conflict.error,
        });
        return;
      }

      setNotification({
        kind: "error",
        text: "No se pudo asignar el joven investigador.",
      });
    }
  }

  async function handleRemoveResearcher(assignmentId: string) {
    const assignment = assignments.find((item) => item.id === assignmentId);

    try {
      await deleteAssignment(assignmentId);

      if (assignment) {
        await refreshEventAssignmentsAndAvailability(assignment.eventId);
      } else {
        setAssignments((currentAssignments) =>
          currentAssignments.filter((item) => item.id !== assignmentId)
        );
      }

      setNotification({
        kind: "success",
        text: "Asignación retirada correctamente.",
      });
    } catch {
      setNotification({
        kind: "error",
        text: "No se pudo quitar la asignación.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Cargando operación de turnos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <TopBar />

      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="min-h-0 flex flex-1 overflow-hidden">
        <ResearcherSidebar researchers={researchers} />

        <CalendarPanel
          events={events}
          assignments={assignments}
          researchers={researchers}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={handleSelectEvent}
          onMoveEvent={handleMoveEvent}
        />

        <EventDetailPanel
          key={selectedEvent?.id ?? "empty-event-detail"}
          selectedEvent={selectedEvent}
          isOpen={isDetailOpen}
          assignments={assignments}
          researcherAvailability={researcherAvailability}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          onAssignResearcher={handleAssignResearcher}
          onRemoveResearcher={handleRemoveResearcher}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
}

export default App;
