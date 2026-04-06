import { useEffect, useMemo, useState } from 'react';

function CreateInvoiceModal({
  isOpen,
  onClose,
  onSave,
  clients,
  seriesOptions,
  serviceOptions,
  isSaving = false,
  error = '',
  mode = 'create',
  initialData = null,
}) {
  const [formData, setFormData] = useState(() =>
    createInitialFormData(clients, seriesOptions, serviceOptions, initialData),
  );
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
      setFormData(createInitialFormData(clients, seriesOptions, serviceOptions, initialData));
      setSubmitError('');
    }
  }, [isOpen, clients, seriesOptions, serviceOptions, initialData]);

  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  const invoiceTotal = useMemo(
    () =>
      formData.items.reduce(
        (sum, item) => sum + getLineTotal(item.quantity, item.unit_price),
        0,
      ),
    [formData.items],
  );

  const invoiceNumberPreview = useMemo(() => {
    if (mode === 'edit' && initialData?.invoice_number) {
      return initialData.invoice_number;
    }

    const selectedSeries = seriesOptions.find((series) => series.id === formData.series_id);

    if (!selectedSeries?.prefix) {
      return 'Select a series';
    }

    const nextNumber = Number(selectedSeries.current_number || 0) + 1;
    return `${selectedSeries.prefix}/${String(nextNumber).padStart(3, '0')}`;
  }, [formData.series_id, initialData?.invoice_number, mode, seriesOptions]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      items: currentData.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleAddItem = () => {
    setFormData((currentData) => ({
      ...currentData,
      items: [...currentData.items, createEmptyItem(serviceOptions)],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((currentData) => ({
      ...currentData,
      items:
        currentData.items.length === 1
          ? currentData.items
          : currentData.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    try {
      await onSave({
        ...formData,
        total_amount: invoiceTotal,
      });
    } catch (saveError) {
      setSubmitError(saveError?.message || saveError?.details || 'Unable to save invoice right now.');
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditMode = mode === 'edit';
  const modalTitle = isEditMode ? 'Edit Invoice' : 'Create Invoice';
  const modalDescription = isEditMode
    ? 'Update invoice details, service line items, and billing metadata.'
    : 'Build an invoice, add service line items, and issue a unique invoice number.';

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
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-invoice-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="create-invoice-title" className="text-xl font-semibold text-slate-900">
              {modalTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{modalDescription}</p>
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Select Client"
                name="client_id"
                value={formData.client_id}
                onChange={handleFieldChange}
                options={clients}
                placeholder="No clients available"
                optionLabelKey="brand_name"
              />
              <SelectField
                label="Select Invoice Series"
                name="series_id"
                value={formData.series_id}
                onChange={handleFieldChange}
                options={seriesOptions}
                placeholder="No series available"
                optionLabelKey="code"
              />
              <ReadOnlyField label="Invoice No." value={invoiceNumberPreview} />
              <FormField
                label="Issue Date"
                name="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={handleFieldChange}
                required
              />
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Invoice Items
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add service rows with quantity and unit pricing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-4 px-5 py-5">
                {formData.items.map((item, index) => {
                  const lineTotal = getLineTotal(item.quantity, item.unit_price);

                  return (
                    <div
                      key={item.local_id || index}
                      className="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 md:grid-cols-[1.3fr_1.4fr_0.8fr_0.8fr_0.8fr_auto]"
                    >
                      <SelectField
                        label="Service"
                        name={`service-${index}`}
                        value={item.service_id}
                        onChange={(event) => handleItemChange(index, 'service_id', event.target.value)}
                        options={serviceOptions}
                        placeholder="No services available"
                        optionLabelKey="name"
                      />
                      <FormField
                        label="Description"
                        name={`description-${index}`}
                        value={item.description}
                        onChange={(event) =>
                          handleItemChange(index, 'description', event.target.value)
                        }
                        placeholder="Add item description"
                      />
                      <FormField
                        label="Quantity"
                        name={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => handleItemChange(index, 'quantity', event.target.value)}
                        required
                      />
                      <FormField
                        label="Price"
                        name={`unit-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(event) =>
                          handleItemChange(index, 'unit_price', event.target.value)
                        }
                        required
                      />
                      <ReadOnlyField label="Total" value={formatCurrency(lineTotal)} />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={formData.items.length === 1}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm font-medium text-slate-500">Invoice Total</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(invoiceTotal)}
              </p>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleFieldChange}
                placeholder="Add billing notes or payment instructions"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
            </div>

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
              disabled={isSaving || !formData.client_id || !formData.series_id}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
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
  step,
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
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'No options available',
  optionLabelKey = 'label',
}) {
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
        {options.length === 0 ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option[optionLabelKey]}
          </option>
        ))}
      </select>
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

function createInitialFormData(clients = [], seriesOptions = [], serviceOptions = [], initialData) {
  const today = getTodayString();

  if (initialData) {
    return {
      id: initialData.id,
      client_id: initialData.client_id || clients[0]?.id || '',
      series_id: initialData.series_id || seriesOptions[0]?.id || '',
      issue_date: initialData.issue_date || today,
      notes: initialData.notes || '',
      items:
        initialData.items?.length > 0
          ? initialData.items.map((item, index) => normalizeInvoiceItem(item, index, serviceOptions))
          : [createEmptyItem(serviceOptions)],
    };
  }

  return {
    client_id: clients[0]?.id || '',
    series_id: seriesOptions[0]?.id || '',
    issue_date: today,
    notes: '',
    items: [createEmptyItem(serviceOptions)],
  };
}

function createEmptyItem(serviceOptions = []) {
  return {
    local_id: `new-${Math.random().toString(36).slice(2, 10)}`,
    service_id: serviceOptions[0]?.id || '',
    description: '',
    quantity: '1',
    unit_price: '0',
  };
}

function normalizeInvoiceItem(item, index, serviceOptions = []) {
  const matchedService = serviceOptions.find((service) => service.name === item.service_name);

  return {
    id: item.id,
    local_id: item.id || `existing-${index}`,
    service_id: item.service_id || matchedService?.id || serviceOptions[0]?.id || '',
    description: item.description || '',
    quantity: String(item.quantity ?? '1'),
    unit_price: String(item.unit_price ?? '0'),
  };
}

function getLineTotal(quantity, price) {
  return Number(quantity || 0) * Number(price || 0);
}

function getTodayString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return `Rs. ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))}`;
}

export default CreateInvoiceModal;
