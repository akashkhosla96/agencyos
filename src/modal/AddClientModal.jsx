import { useEffect, useState } from 'react';

const initialFormData = {
  clientName: '',
  brandName: '',
  phoneNumber: '',
  instagramHandle: '',
  businessType: 'Marketing Agency',
  location: '',
  planType: 'Monthly',
  planPrice: '',
  services: [],
  notes: '',
};

const businessTypes = [
  'Marketing Agency',
  'E-commerce',
  'Personal Brand',
  'Restaurant',
  'Real Estate',
  'Other',
];

const serviceOptions = ['SMM', 'SHOOTS', 'GOOGLE LOCAL SEO', 'WEBSITE'];

function AddClientModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(initialFormData);

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
    if (!isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData((currentData) => {
      const isSelected = currentData.services.includes(service);

      return {
        ...currentData,
        services: isSelected
          ? currentData.services.filter((item) => item !== service)
          : [...currentData.services, service],
      };
    });
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
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-client-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="add-client-title" className="text-xl font-semibold text-slate-900">
              Add New Client
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Capture the essential details before assigning projects and billing.
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
              label="Client Name"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Enter client name"
              required
            />
            <FormField
              label="Brand Name"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              placeholder="Enter brand name"
              required
            />
            <FormField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
            <FormField
              label="Instagram Handle"
              name="instagramHandle"
              value={formData.instagramHandle}
              onChange={handleChange}
              placeholder="@brandhandle"
            />
            <SelectField
              label="Business Type"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              options={businessTypes}
            />
            <FormField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
            />
            <SelectField
              label="Plan Type"
              name="planType"
              value={formData.planType}
              onChange={handleChange}
              options={['Monthly', 'Per Shoot', 'Custom']}
            />
            <FormField
              label="Plan Price"
              name="planPrice"
              value={formData.planPrice}
              onChange={handleChange}
              placeholder="Enter bill amount"
              required
            />
            <div className="sm:col-span-2">
              <p className="mb-2 block text-sm font-medium text-slate-700">Services</p>
              <div className="flex flex-wrap gap-2">
                {serviceOptions.map((service) => {
                  const isSelected = formData.services.includes(service);

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleServiceToggle(service)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Select one or more services for this client.
              </p>
            </div>
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
                placeholder="Add any important context about this client"
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
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, placeholder, required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
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

export default AddClientModal;
