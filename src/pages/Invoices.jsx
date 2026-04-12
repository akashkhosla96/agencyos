import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Printer } from 'lucide-react';
import CreateInvoiceModal from '../modal/CreateInvoiceModal';
import ViewInvoiceModal from '../modal/ViewInvoiceModal';
import { supabase } from '../services/supabaseClient';
import { printInvoiceDocument } from '../utils/invoicePrintTemplate';
import { generateNextInvoiceNumber } from '../utils/invoiceNumber';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [invoiceItemsById, setInvoiceItemsById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [
          { data: invoicesData, error: invoicesError },
          { data: clientsData, error: clientsError },
          { data: seriesData, error: seriesError },
          { data: servicesData, error: servicesError },
        ] = await Promise.all([
          supabase.from('invoices').select('*').order('issue_date', { ascending: false }),
          supabase
            .from('client_table')
            .select('id, name, brand_name, phone, location')
            .order('brand_name', { ascending: true }),
          supabase.from('invoice_series').select('*').order('created_at', { ascending: false }),
          supabase.from('services').select('*').order('name', { ascending: true }),
        ]);

        if (invoicesError) {
          throw invoicesError;
        }

        if (clientsError) {
          throw clientsError;
        }

        if (seriesError) {
          throw seriesError;
        }

        if (servicesError) {
          throw servicesError;
        }

        setInvoices(invoicesData || []);
        setClients(clientsData || []);
        setSeriesOptions(seriesData || []);
        setServiceOptions(servicesData || []);
      } catch (fetchError) {
        console.error('Error fetching invoice data:', fetchError);
        setError(getSupabaseErrorMessage(fetchError, 'Unable to load invoices right now.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, []);

  const clientsById = useMemo(
    () =>
      clients.reduce((lookup, client) => {
        lookup[client.id] = client;
        return lookup;
      }, {}),
    [clients],
  );

  const servicesById = useMemo(
    () =>
      serviceOptions.reduce((lookup, service) => {
        lookup[service.id] = service;
        return lookup;
      }, {}),
    [serviceOptions],
  );

  const invoicesWithClientNames = useMemo(
    () =>
      invoices.map((invoice) => ({
        ...invoice,
        client: clientsById[invoice.client_id] || null,
        clientName: clientsById[invoice.client_id]?.brand_name || 'Unknown client',
      })),
    [invoices, clientsById],
  );

  const viewItems = viewInvoice ? invoiceItemsById[viewInvoice.id] || [] : [];

  const fetchInvoiceItems = async (invoiceId, forceRefresh = false) => {
    if (!forceRefresh && invoiceItemsById[invoiceId]) {
      return invoiceItemsById[invoiceId];
    }

    const { data, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id', { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    const items = data || [];
    setInvoiceItemsById((currentItems) => ({
      ...currentItems,
      [invoiceId]: items,
    }));

    return items;
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    setError('');
    setIsModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
    setError('');
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewInvoice(null);
    setIsViewLoading(false);
    setViewError('');
  };

  const handleViewInvoice = async (invoice) => {
    setViewInvoice(invoice);
    setIsViewModalOpen(true);
    setIsViewLoading(true);
    setViewError('');

    try {
      await fetchInvoiceItems(invoice.id);
    } catch (itemsError) {
      console.error('Error loading invoice items:', itemsError);
      setViewError(getSupabaseErrorMessage(itemsError, 'Unable to load invoice items.'));
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleEditInvoice = async (invoice) => {
    setError('');
    setIsSaving(false);

    try {
      const items = await fetchInvoiceItems(invoice.id);
      setEditingInvoice({
        ...invoice,
        items,
      });
      setIsModalOpen(true);
    } catch (itemsError) {
      console.error('Error loading invoice for edit:', itemsError);
      setError(getSupabaseErrorMessage(itemsError, 'Unable to load invoice items for editing.'));
    }
  };

  const handlePrintInvoice = async (invoice) => {
    try {
      const items = await fetchInvoiceItems(invoice.id);
      printInvoiceDocument({
        invoice,
        client: invoice.client,
        items,
      });
    } catch (itemsError) {
      console.error('Error printing invoice:', itemsError);
      setError(getSupabaseErrorMessage(itemsError, 'Unable to prepare the invoice for printing.'));
    }
  };

  const buildInvoiceItemsPayload = (items, invoiceId) =>
    items.map((item) => {
      const selectedService = servicesById[item.service_id];
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);

      return {
        invoice_id: invoiceId,
        service_name: selectedService?.name || item.service_name || '',
        description: normalizeOptionalText(item.description),
        quantity,
        unit_price: unitPrice,
        total: quantity * unitPrice,
      };
    });

  const handleSaveInvoice = async (invoiceData) => {
    setIsSaving(true);
    setError('');

    try {
      if (editingInvoice) {
        const invoicePayload = {
          client_id: invoiceData.client_id,
          series_id: invoiceData.series_id,
          total_amount: invoiceData.total_amount,
          issue_date: invoiceData.issue_date,
          notes: normalizeOptionalText(invoiceData.notes),
        };

        const { data: updatedInvoice, error: invoiceUpdateError } = await supabase
          .from('invoices')
          .update(invoicePayload)
          .eq('id', editingInvoice.id)
          .select()
          .single();

        if (invoiceUpdateError) {
          throw invoiceUpdateError;
        }

        const { error: deleteItemsError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', editingInvoice.id);

        if (deleteItemsError) {
          throw deleteItemsError;
        }

        const invoiceItemsPayload = buildInvoiceItemsPayload(invoiceData.items, editingInvoice.id);

        if (invoiceItemsPayload.length > 0) {
          const { error: insertItemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItemsPayload);

          if (insertItemsError) {
            throw insertItemsError;
          }
        }

        setInvoices((currentInvoices) =>
          currentInvoices.map((invoice) =>
            invoice.id === editingInvoice.id ? updatedInvoice : invoice,
          ),
        );
        setInvoiceItemsById((currentItems) => ({
          ...currentItems,
          [editingInvoice.id]: invoiceItemsPayload,
        }));
      } else {
        const { series, nextNumber, invoiceNumber } = await generateNextInvoiceNumber(
          invoiceData.series_id,
        );

        const invoicePayload = {
          client_id: invoiceData.client_id,
          series_id: invoiceData.series_id,
          invoice_number: invoiceNumber,
          total_amount: invoiceData.total_amount,
          issue_date: invoiceData.issue_date,
          notes: normalizeOptionalText(invoiceData.notes),
        };

        const { data: createdInvoice, error: invoiceInsertError } = await supabase
          .from('invoices')
          .insert([invoicePayload])
          .select()
          .single();

        if (invoiceInsertError) {
          throw invoiceInsertError;
        }

        const invoiceItemsPayload = buildInvoiceItemsPayload(invoiceData.items, createdInvoice.id);

        if (invoiceItemsPayload.length > 0) {
          const { error: itemsInsertError } = await supabase
            .from('invoice_items')
            .insert(invoiceItemsPayload);

          if (itemsInsertError) {
            throw itemsInsertError;
          }
        }

        const { error: seriesUpdateError } = await supabase
          .from('invoice_series')
          .update({ current_number: nextNumber })
          .eq('id', series.id);

        if (seriesUpdateError) {
          throw seriesUpdateError;
        }

        setInvoices((currentInvoices) => [createdInvoice, ...currentInvoices]);
        setInvoiceItemsById((currentItems) => ({
          ...currentItems,
          [createdInvoice.id]: invoiceItemsPayload,
        }));
        setSeriesOptions((currentSeriesOptions) =>
          currentSeriesOptions.map((seriesOption) =>
            seriesOption.id === series.id
              ? { ...seriesOption, current_number: nextNumber }
              : seriesOption,
          ),
        );
      }

      closeInvoiceModal();
    } catch (saveError) {
      console.error('Error saving invoice:', saveError);
      const message = getSupabaseErrorMessage(saveError, 'Unable to save invoice right now.');
      setError(message);
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, issue, and track invoices from your configured billing series.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-900">Invoice Register</h2>

          </div>

          {error ? (
            <div className="border-b border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading invoices...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    {['Invoice Number', 'Issue Date', 'Client Name', 'Amount'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoicesWithClientNames.map((invoice) => (
                    <tr key={invoice.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {invoice.clientName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(invoice)}
                            aria-label={`View invoice ${invoice.invoice_number}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditInvoice(invoice)}
                            aria-label={`Edit invoice ${invoice.invoice_number}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintInvoice(invoice)}
                            aria-label={`Print invoice ${invoice.invoice_number}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-emerald-600"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoicesWithClientNames.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        No invoices created yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={closeInvoiceModal}
        onSave={handleSaveInvoice}
        clients={clients}
        seriesOptions={seriesOptions}
        serviceOptions={serviceOptions}
        isSaving={isSaving}
        error={error}
        mode={editingInvoice ? 'edit' : 'create'}
        initialData={editingInvoice}
      />

      <ViewInvoiceModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        invoice={viewInvoice}
        items={viewItems}
        isLoading={isViewLoading}
        error={viewError}
      />
    </>
  );
}

function normalizeOptionalText(value) {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue === '' ? null : normalizedValue;
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

function getSupabaseErrorMessage(error, fallbackMessage) {
  if (error?.message) {
    return error.message;
  }

  if (error?.details) {
    return error.details;
  }

  return fallbackMessage;
}

export default Invoices;
