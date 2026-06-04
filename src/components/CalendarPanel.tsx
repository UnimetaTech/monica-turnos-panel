import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { Assignment, MonicaEvent, YoungResearcher } from "../types";
import { EVENT_STATUS_META } from "../lib/eventPresentation";

type Props = {
  events: MonicaEvent[];
  assignments: Assignment[];
  researchers: YoungResearcher[];
  selectedEventId: string | null;
  onSelectEvent: (event: MonicaEvent) => void;
  onMoveEvent: (eventId: string, start: string, end: string) => void;
};

export function CalendarPanel({
  events,
  assignments,
  researchers,
  selectedEventId,
  onSelectEvent,
  onMoveEvent,
}: Props) {
  const calendarEvents = events.map((event) => {
    const eventAssignments = assignments.filter(
      (assignment) => assignment.eventId === event.id
    );

    const assignedNames = eventAssignments
      .map((assignment) => {
        const researcher = researchers.find(
          (item) => item.id === assignment.researcherId
        );

        return researcher?.name;
      })
      .filter(Boolean)
      .join(", ");

    return {
      id: event.id,
      title: assignedNames
        ? `${event.title} · ${assignedNames}`
        : event.title,
      start: event.start,
      end: event.end,
      backgroundColor: EVENT_STATUS_META[event.status].calendarColor,
      borderColor: "transparent",
      classNames: event.id === selectedEventId ? ["is-selected-event"] : [],
      extendedProps: {
        monicaEvent: event,
      },
    };
  });

  function handleEventClick(info: EventClickArg) {
    const event = info.event.extendedProps.monicaEvent as MonicaEvent;
    onSelectEvent(event);
  }

  function handleEventDrop(info: EventDropArg) {
    const eventId = info.event.id;
    const start = info.event.start?.toISOString();
    const end = info.event.end?.toISOString();

    if (!start || !end) {
      info.revert();
      return;
    }

    onMoveEvent(eventId, start, end);
  }

  function handleEventResize(info: EventResizeDoneArg) {
    const eventId = info.event.id;
    const start = info.event.start?.toISOString();
    const end = info.event.end?.toISOString();

    if (!start || !end) {
      info.revert();
      return;
    }

    onMoveEvent(eventId, start, end);
  }

  return (
    <main className="min-w-0 flex-1 overflow-hidden p-4">
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="es"
          height="100%"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          nowIndicator
          editable
          selectable
          events={calendarEvents}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>
    </main>
  );
}
