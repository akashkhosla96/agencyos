function ViewInvoiceModal({
  isOpen,
  onClose,
  invoice,
  items = [],
  isLoading = false,
  error = '',
}) {
  if (!isOpen || !invoice) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-4 backdrop-blur-sm sm:px-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-invoice-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="view-invoice-title" className="text-xl font-semibold text-slate-900">
              Invoice Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the full invoice summary and line items.
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DetailCard label="Invoice Number" value={invoice.invoice_number} />
            <DetailCard label="Client Name" value={invoice.clientName} />
            <DetailCard label="Issue Date" value={formatDate(invoice.issue_date)} />
            <DetailCard label="Notes" value={invoice.notes || '-'} fullWidth />
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Invoice Items
              </h3>
            </div>

            {isLoading ? (
              <div className="px-5 py-6 text-sm text-slate-500">Loading invoice items...</div>
            ) : error ? (
              <div className="px-5 py-6 text-sm text-rose-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {['Service Name', 'Quantity', 'Price', 'Total'].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {items.length > 0 ? (
                      items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 text-sm text-slate-900">
                            <div className="font-medium">{item.service_name || '-'}</div>
                            {item.description ? (
                              <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-500">
                          No invoice items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium text-slate-500">Total Amount</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(invoice.total_amount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2 xl:col-span-3' : ''}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-2 text-sm text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return `Rs. ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))}`;
}

function formatDate(dateString) {
  if (!dateString) {
    return '-';
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default ViewInvoiceModal;
