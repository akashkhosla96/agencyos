import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AddClientModal from '../modal/AddClientModal';
import { supabase } from '../services/supabaseClient';

function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [
          { data: clientsData, error: clientsError },
          { data: invoicesData, error: invoicesError },
          { data: receiptsData, error: receiptsError },
        ] = await Promise.all([
          supabase.from('client_table').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('client_id, total_amount'),
          supabase.from('receipts').select('client_id, amount'),
        ]);

        if (clientsError) {
          throw clientsError;
        }

        if (invoicesError) {
          throw invoicesError;
        }

        if (receiptsError) {
          throw receiptsError;
        }

        setClients(clientsData || []);
        setInvoices(invoicesData || []);
        setReceipts(receiptsData || []);
      } catch (fetchError) {
        console.error('Error fetching clients:', fetchError);
        setError(getSupabaseErrorMessage(fetchError, 'Unable to load clients right now.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const totalBilledByClient = useMemo(
    () =>
      invoices.reduce((totals, invoice) => {
        if (!invoice.client_id) {
          return totals;
        }

        const currentTotal = totals[invoice.client_id] || 0;
        totals[invoice.client_id] = currentTotal + Number(invoice.total_amount || 0);
        return totals;
      }, {}),
    [invoices],
  );

  const totalReceivedByClient = useMemo(
    () =>
      receipts.reduce((totals, receipt) => {
        if (!receipt.client_id) {
          return totals;
        }

        const currentTotal = totals[receipt.client_id] || 0;
        totals[receipt.client_id] = currentTotal + Number(receipt.amount || 0);
        return totals;
      }, {}),
    [receipts],
  );

  const handleSaveClient = async (clientData) => {
    setIsSaving(true);
    setError('');

    const payload = {
      name: clientData.clientName.trim(),
      brand_name: clientData.brandName.trim(),
      phone: normalizeOptionalText(clientData.phoneNumber),
      instagram: normalizeOptionalText(clientData.instagramHandle),
      business_type: clientData.businessType,
      location: normalizeOptionalText(clientData.location),
      plan_type: clientData.planType,
      plan_price: parsePlanPrice(clientData.planPrice),
      services: Array.isArray(clientData.services) ? clientData.services : [],
      notes: normalizeOptionalText(clientData.notes),
    };

    try {
      const { data, error: insertError } = await supabase
        .from('client_table')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setClients((currentClients) => [data, ...currentClients]);
      setIsModalOpen(false);
    } catch (insertError) {
      console.error('Error saving client:', insertError);
      setError(getSupabaseErrorMessage(insertError, 'Unable to save client right now.'));
      throw insertError;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
           
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              New Client
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Client Directory</h2>
            </div>
          </div>

          {error ? (
            <div className="border-b border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading clients...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    {[
                      'Client',
                      'Plan',
                      'Price',
                      'Services',
                      'Total Billed',
                      'Pending Amount',
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clients.map((client) => {
                    const planPrice = formatCurrency(client.plan_price);
                    const totalBilledValue = totalBilledByClient[client.id] || 0;
                    const totalReceivedValue = totalReceivedByClient[client.id] || 0;
                    const pendingAmountValue = Math.max(totalBilledValue - totalReceivedValue, 0);
                    const totalBilled = formatCurrency(totalBilledValue);
                    const pendingAmount = formatCurrency(pendingAmountValue);

                    return (
                      <tr key={client.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {getInitials(client.name)}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/clients/${client.id}`}
                                className="text-sm font-medium text-slate-900 underline-offset-4 transition hover:text-blue-600 hover:underline"
                              >
                                {client.name}
                              </Link>
                              <p className="mt-0.5 break-words text-xs text-slate-500">
                                {client.brand_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {client.phone || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {client.plan_type || '-'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {planPrice}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex min-w-[200px] flex-wrap gap-1.5">
                            {client.services?.length ? (
                              client.services.map((service) => (
                                <span
                                  key={service}
                                  className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10"
                                >
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">No services added</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {totalBilled}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              pendingAmountValue > 0
                                ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            }`}
                          >
                            {pendingAmount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
}

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('') || '--'
  );
}

function parsePlanPrice(value) {
  const numericValue = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function normalizeOptionalText(value) {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue === '' ? null : normalizedValue;
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

function formatCurrency(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Rs. 0';
  }

  return `Rs. ${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(numericValue)}`;
}

export default Clients;
