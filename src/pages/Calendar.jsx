import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import EventModal from '../modal/EventModal';

const dummyClients = [
  'Glow Media Co.',
  'Luxe Studio',
  'Peak Performance',
  'The Bloom House',
  'Aman Clothing',
  'Cafe Delhi',
];

const initialEvents = [
  {
    id: 1,
    title: 'Campaign Shoot',
    client: 'Aman Clothing',
    date: '2026-04-04',
    time: '10:00',
    type: 'Shoot',
    notes: 'Lifestyle content for the summer collection.',
  },
  {
    id: 2,
    title: 'Brand Review Meeting',
    client: 'Cafe Delhi',
    date: '2026-04-04',
    time: '14:00',
    type: 'Meeting',
    notes: 'Review creative concepts and launch timeline.',
  },
  {
    id: 3,
    title: 'Website Planning',
    client: 'Glow Media Co.',
    date: '2026-04-09',
    time: '12:30',
    type: 'Other',
    notes: 'Finalize sitemap and page priorities.',
  },
  {
    id: 4,
    title: 'Studio Shoot',
    client: 'Luxe Studio',
    date: '2026-04-16',
    time: '11:00',
    type: 'Shoot',
    notes: 'Quarterly social media production day.',
  },
];

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar() {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(() => getMonthStart(today));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState(initialEvents);

  const monthDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const selectedDateEvents = [...(eventsByDate[selectedDate] || [])].sort((a, b) =>
    a.time.localeCompare(b.time),
  );

  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === editingEvent.id ? { ...editingEvent, ...eventData } : event,
        ),
      );
    } else {
      const nextEvent = {
        id: Date.now(),
        ...eventData,
      };

      setEvents((currentEvents) => [...currentEvents, nextEvent]);
    }

    setSelectedDate(eventData.date);
    setCurrentMonth(getMonthStart(eventData.date));
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEvent(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendar</h1>
            <p className="mt-1 text-sm text-slate-500">
              Schedule shoots, manage meetings, and keep upcoming work organized.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={handleAddEvent}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              New Event
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-10">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 lg:col-span-7">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {currentMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Click a date to review or schedule work.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <MonthButton onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}>
                  Previous
                </MonthButton>
                <MonthButton
                  onClick={() => {
                    setCurrentMonth(getMonthStart(today));
                    setSelectedDate(today);
                  }}
                >
                  Today
                </MonthButton>
                <MonthButton onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}>
                  Next
                </MonthButton>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {dayLabels.map((day) => (
                <div
                  key={day}
                  className="px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayEvents = eventsByDate[day.iso] || [];
                const isSelected = day.iso === selectedDate;
                const isToday = day.iso === today;

                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.iso);
                      if (!day.isCurrentMonth) {
                        setCurrentMonth(getMonthStart(day.iso));
                      }
                    }}
                    className={`flex min-h-[108px] flex-col justify-between border-b border-r border-slate-200 p-3 text-left transition hover:bg-slate-50 ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-400'
                    } ${isSelected ? 'bg-cyan-50 shadow-inner shadow-cyan-100' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                          isSelected
                            ? 'bg-cyan-600 text-white'
                            : isToday
                              ? 'border border-cyan-200 bg-cyan-50 text-cyan-700'
                              : day.isCurrentMonth
                                ? 'text-slate-900'
                                : 'text-slate-400'
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={`h-2.5 w-2.5 rounded-full ${getEventDotColor(event.type)}`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 lg:col-span-3">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                Daily View
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Today&apos;s Schedule</h2>
              <p className="mt-1 text-sm text-slate-500">{formatSelectedDate(selectedDate)}</p>
            </div>

            <div className="space-y-3 px-6 py-6">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatTime(event.time)} - {event.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{event.client}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeBadgeClass(
                            event.type,
                          )}`}
                        >
                          {event.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditEvent(event)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {event.notes ? (
                      <p className="mt-3 text-sm leading-6 text-slate-500">{event.notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No events for today</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add a shoot, meeting, or work block to get started.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        clients={dummyClients}
        defaultDate={selectedDate}
        initialEvent={editingEvent}
      />
    </>
  );
}

function MonthButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </button>
  );
}

function buildCalendarDays(monthStart) {
  const month = monthStart.getMonth();
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(1 - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      iso: formatDate(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function groupEventsByDate(events) {
  return events.reduce((groups, event) => {
    if (!groups[event.date]) {
      groups[event.date] = [];
    }

    groups[event.date].push(event);
    return groups;
  }, {});
}

function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function getMonthStart(dateString) {
  const date =
    typeof dateString === 'string' ? new Date(`${dateString}T00:00:00`) : new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatDate(new Date());
}

function formatSelectedDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEventDotColor(type) {
  if (type === 'Shoot') {
    return 'bg-cyan-400';
  }

  if (type === 'Meeting') {
    return 'bg-emerald-400';
  }

  return 'bg-amber-400';
}

function getTypeBadgeClass(type) {
  if (type === 'Shoot') {
    return 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200';
  }

  if (type === 'Meeting') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
}

export default Calendar;
