import { useEffect, useMemo, useState } from 'react';

function AddSeriesModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  error = '',
  initialSeries,
  currentFinancialYear,
}) {
  const [formData, setFormData] = useState(() => createInitialFormData(initialSeries));
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isSaving) {
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
  }, [isOpen, onClose, isSaving]);

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData(initialSeries));
      setSubmitError('');
    }
  }, [isOpen, initialSeries]);

  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  const previewPrefix = useMemo(
    () => buildPrefix(formData.code, currentFinancialYear),
    [formData.code, currentFinancialYear],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    try {
      await onSave(formData);
    } catch (saveError) {
      setSubmitError(
        saveError?.message || saveError?.details || 'Unable to save invoice series right now.',
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-4 backdrop-blur-sm sm:px-6"
      onClick={() => {
        if (!isSaving) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-modal-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="series-modal-title" className="text-xl font-semibold text-slate-900">
              {initialSeries ? 'Edit Series' : 'Add Series'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure invoice numbering rules for the current financial year.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                label="Series Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter series name"
                required
              />
              <FormField
                label="Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="INV"
                required
              />
              <ReadOnlyField label="Financial Year" value={currentFinancialYear} />
              <FormField
                label="Current Number"
                name="currentNumber"
                type="number"
                min="0"
                value={formData.currentNumber}
                onChange={handleChange}
                placeholder="0"
                required
              />
              <ReadOnlyField label="Prefix" value={previewPrefix} />
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Financial year is generated automatically and series are reset when the financial year changes.
            </p>

            {submitError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {submitError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : initialSeries ? 'Update Series' : 'Save Series'}
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
  min,
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
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
        {value}
      </div>
    </div>
  );
}

function createInitialFormData(initialSeries) {
  if (!initialSeries) {
    return {
      name: '',
      code: '',
      currentNumber: '0',
    };
  }

  return {
    name: initialSeries.name || '',
    code: initialSeries.code || '',
    currentNumber: String(initialSeries.current_number ?? 0),
  };
}

function buildPrefix(code, financialYear) {
  const normalizedCode = String(code || '').trim().toUpperCase();

  if (!normalizedCode || !financialYear) {
    return '';
  }

  return `${normalizedCode}/${financialYear}`;
}

export default AddSeriesModal;
