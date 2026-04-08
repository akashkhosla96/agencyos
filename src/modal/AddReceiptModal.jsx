import { useEffect, useMemo, useState } from 'react';

const receiptModes = ['Cash', 'Bank', 'UPI'];

function AddReceiptModal({
  isOpen,
  onClose,
  onSave,
  clients = [],
  isSaving = false,
  error = '',
  initialData = null,
  readOnly = false,
  onDelete = null,
}) {
  const [formData, setFormData] = useState(getInitialFormData);
  const [submitError, setSubmitError] = useState('');

  const clientsById = useMemo(
    () =>
      clients.reduce((lookup, client) => {
        lookup[client.id] = client;
        return lookup;
      }, {}),
    [clients],
  );

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
  }, [isOpen, isSaving, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(getInitialFormData());
      setSubmitError('');
      return;
    }

    if (initialData) {
      setFormData(mapInitialData(initialData));
      return;
    }

    setFormData(getInitialFormData());
  }, [isOpen]);

  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleClientChange = (event) => {
    const clientId = event.target.value;
    const selectedClient = clientId ? clientsById[clientId] : null;

    setFormData((currentData) => ({
      ...currentData,
      clientId: clientId || '',
      account: selectedClient?.brand_name || currentData.account,
    }));
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    const confirmed = window.confirm('Delete this receipt entry? This action cannot be undone.');
    if (!confirmed) return;
    await onDelete(initialData.id);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!formData.account.trim()) {
      setSubmitError('Account is required.');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setSubmitError('Enter a valid amount.');
      return;
    }

    try {
      await onSave(formData);
    } catch (saveError) {
      setSubmitError(
        saveError?.message || saveError?.details || 'Unable to save receipt right now.',
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
        aria-labelledby="add-receipt-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="add-receipt-title" className="text-xl font-semibold text-slate-900">
              {initialData ? 'Edit Receipt Entry' : 'Add Receipt Entry'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick money-in posting with optional client tagging for ledger tracking.
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
              <Field label="Receipt Date" htmlFor="receiptDate">
                <input
                  id="receiptDate"
                  name="receiptDate"
                  type="date"
                  value={formData.receiptDate}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </Field>

              <Field label="Mode" htmlFor="mode">
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className={inputClassName}
                  disabled={readOnly}
                >
                  {receiptModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Select Client (Optional)" htmlFor="clientId">
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleClientChange}
                    className={inputClassName}
                  >
                    <option value="">Manual account entry</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.brand_name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Account" htmlFor="account">
                <input
                  id="account"
                  name="account"
                  type="text"
                  value={formData.account}
                      onChange={handleChange}
                      disabled={readOnly}
                  placeholder="Enter account or party name"
                  autoFocus
                  required
                  className={inputClassName}
                />
              </Field>

              <Field label="Amount" htmlFor="amount">
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                      onChange={handleChange}
                      disabled={readOnly}
                  placeholder="0.00"
                  required
                  className={inputClassName}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Notes" htmlFor="notes">
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={readOnly}
                    placeholder="Optional narration or reference"
                    className={`${inputClassName} resize-none`}
                  />
                </Field>
              </div>
            </div>

            {submitError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {submitError}
              </p>
            ) : null}
          </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              {readOnly && initialData ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {!readOnly && (
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (initialData ? 'Updating...' : 'Saving...') : initialData ? 'Update Receipt' : 'Save Receipt'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function mapInitialData(d) {
  return {
    id: d.id,
    receiptDate: d.receipt_date ? String(d.receipt_date).slice(0, 10) : getTodayDate(),
    clientId: d.client_id || '',
    account: d.account || '',
    amount: d.amount ?? '',
    mode: d.mode || 'Cash',
    notes: d.notes || '',
  };
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialFormData() {
  return {
    receiptDate: getTodayDate(),
    clientId: '',
    account: '',
    amount: '',
    mode: 'Cash',
    notes: '',
  };
}

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100';

export default AddReceiptModal;
