import { useEffect, useState } from 'react';

function EventModal({ isOpen, onClose, onSave, clients, defaultDate, initialEvent }) {
  const [formData, setFormData] = useState(() => createInitialFormData(defaultDate));

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialEvent
          ? createFormDataFromEvent(initialEvent)
          : createInitialFormData(defaultDate, clients[0] || ''),
      );
    }
  }, [isOpen, defaultDate, clients, initialEvent]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-4 backdrop-blur-sm sm:px-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-event-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="add-event-title" className="text-xl font-semibold text-slate-900">
              {initialEvent ? 'Edit Event' : 'Add Event'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {initialEvent
                ? 'Update the schedule details and keep the calendar in sync.'
                : 'Schedule a shoot, meeting, or internal task for the selected day.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                required
              />
              <SelectField
                label="Select Client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                options={clients}
              />
              <FormField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <FormField
                label="Time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
              <SelectField
                label="Event Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={['Shoot', 'Meeting', 'Other']}
              />
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add context for the team"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {initialEvent ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function createInitialFormData(defaultDate, defaultClient = '') {
  return {
    title: '',
    client: defaultClient,
    date: defaultDate,
    time: '10:00',
    type: 'Shoot',
    notes: '',
  };
}

function createFormDataFromEvent(event) {
  return {
    title: event.title,
    client: event.client,
    date: event.date,
    time: event.time,
    type: event.type,
    notes: event.notes || '',
  };
}

export default EventModal;
