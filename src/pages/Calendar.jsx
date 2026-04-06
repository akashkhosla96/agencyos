import { useEffect, useMemo, useState } from 'react';
import { EllipsisVertical, Plus, Trash2, Pencil } from 'lucide-react';
import EventModal from '../modal/EventModal';
import { supabase } from '../services/supabaseClient';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar() {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(() => getMonthStart(today));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [{ data: eventsData, error: eventsError }, { data: clientsData, error: clientsError }] =
          await Promise.all([
            supabase.from('events').select('*').order('date', { ascending: true }),
            supabase.from('client_table').select('id, brand_name').order('brand_name', { ascending: true }),
          ]);

        if (eventsError) {
          throw eventsError;
        }

        if (clientsError) {
          throw clientsError;
        }

        setEvents(eventsData || []);
        setClients(clientsData || []);
      } catch (fetchError) {
        console.error('Error fetching calendar data:', fetchError);
        setError('Unable to load calendar data right now.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenActionMenuId(null);
    };

    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  const clientsById = useMemo(
    () =>
      clients.reduce((lookup, client) => {
        lookup[client.id] = client.brand_name;
        return lookup;
      }, {}),
    [clients],
  );

  const eventsWithClientNames = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        clientName: clientsById[event.client_id] || 'No client linked',
      })),
    [events, clientsById],
  );

  const monthDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const eventsByDate = useMemo(() => groupEventsByDate(eventsWithClientNames), [eventsWithClientNames]);

  const selectedDateEvents = [...(eventsByDate[selectedDate] || [])].sort((a, b) =>
    a.time.localeCompare(b.time),
  );

  const handleSaveEvent = async (eventData) => {
    setIsSaving(true);
    setError('');

    const payload = {
      title: eventData.title.trim(),
      client_id: eventData.client_id || null,
      date: eventData.date,
      time: eventData.time,
      type: eventData.type,
      notes: eventData.notes.trim(),
    };

    try {
      if (editingEvent) {
        const { data, error: updateError } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setEvents((currentEvents) =>
          currentEvents.map((event) => (event.id === editingEvent.id ? data : event)),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('events')
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setEvents((currentEvents) => [...currentEvents, data]);
      }

      setSelectedDate(eventData.date);
      setCurrentMonth(getMonthStart(eventData.date));
      setEditingEvent(null);
      setIsModalOpen(false);
    } catch (saveError) {
      console.error('Error saving event:', saveError);
      setError('Unable to save event right now.');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    setDeletingEventId(eventId);
    setOpenActionMenuId(null);
    setError('');

    try {
      const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId);

      if (deleteError) {
        throw deleteError;
      }

      setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));

      if (editingEvent?.id === eventId) {
        setEditingEvent(null);
        setIsModalOpen(false);
      }
    } catch (deleteError) {
      console.error('Error deleting event:', deleteError);
      setError('Unable to delete event right now.');
    } finally {
      setDeletingEventId(null);
    }
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

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

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

            {isLoading ? (
              <div className="px-6 py-10 text-sm text-slate-500">Loading calendar...</div>
            ) : (
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
            )}
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
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">Loading events...</p>
                </div>
              ) : selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatTime(event.time)} - {event.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{event.clientName}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeBadgeClass(
                            event.type,
                          )}`}
                        >
                          {event.type}
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setOpenActionMenuId((currentId) =>
                                currentId === event.id ? null : event.id,
                              );
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label={`Open actions for ${event.title}`}
                            aria-expanded={openActionMenuId === event.id}
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </button>

                          {openActionMenuId === event.id ? (
                            <div
                              className="absolute right-0 top-11 z-10 min-w-[140px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/70"
                              onClick={(clickEvent) => clickEvent.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleEditEvent(event);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(event.id)}
                                disabled={deletingEventId === event.id}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingEventId === event.id ? (
                                  <span className="h-4 w-4 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          ) : null}
                        </div>
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
        clients={clients}
        defaultDate={selectedDate}
        initialEvent={editingEvent}
        isSaving={isSaving}
        error={error}
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
