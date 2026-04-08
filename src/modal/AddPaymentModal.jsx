import { useEffect, useState } from 'react';

function AddPaymentModal({ isOpen, onClose, onSave, isSaving = false, error = '', initialData = null, readOnly = false, onDelete = null }) {
  const [formData, setFormData] = useState(getInitialFormData);
  const [submitError, setSubmitError] = useState('');

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
  }, [isOpen, initialData]);

  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setSubmitError(saveError?.message || 'Unable to save payment right now.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-4 backdrop-blur-sm sm:px-6"
      onClick={() => {
        if (!isSaving) onClose();
      }}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-payment-title"
      >
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="add-payment-title" className="text-xl font-semibold text-slate-900">
              {initialData ? (readOnly ? 'View Payment' : 'Edit Payment') : 'Add Payment'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Record an outgoing payment.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Date" htmlFor="paymentDate">
                <input id="paymentDate" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleChange} required className={inputClassName} disabled={readOnly} />
              </Field>

              <Field label="Mode" htmlFor="mode">
                <select id="mode" name="mode" value={formData.mode} onChange={handleChange} className={inputClassName} disabled={readOnly}>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="UPI">UPI</option>
                </select>
              </Field>

              <Field label="Account" htmlFor="account">
                <input id="account" name="account" type="text" value={formData.account} onChange={handleChange} placeholder="Office Rent, Salary, etc." autoFocus required className={inputClassName} disabled={readOnly} />
              </Field>

              <Field label="Amount" htmlFor="amount">
                <input id="amount" name="amount" type="number" min="0" step="0.01" value={formData.amount} onChange={handleChange} placeholder="0.00" required className={inputClassName} disabled={readOnly} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Notes" htmlFor="notes">
                  <textarea id="notes" name="notes" rows="4" value={formData.notes} onChange={handleChange} placeholder="Optional notes" className={`${inputClassName} resize-none`} disabled={readOnly} />
                </Field>
              </div>
            </div>

            {submitError ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{submitError}</p> : null}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isSaving} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Close</button>

              {readOnly && initialData ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!initialData || !onDelete) return;
                    const confirmed = window.confirm('Delete this payment entry? This action cannot be undone.');
                    if (!confirmed) return;
                    await onDelete(initialData.id);
                    onClose();
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {!readOnly && (
              <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Payment'}</button>
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
    paymentDate: d.payment_date ? String(d.payment_date).slice(0, 10) : getTodayDate(),
    account: d.account || '',
    amount: d.amount ?? '',
    mode: d.mode || 'Cash',
    notes: d.notes || '',
  };
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialFormData() {
  return {
    paymentDate: getTodayDate(),
    account: '',
    amount: '',
    mode: 'Cash',
    notes: '',
  };
}

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100';

export default AddPaymentModal;
