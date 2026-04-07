import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, CreditCard, IndianRupee, MapPin, Phone, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

function ClientDetail() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClientDetail = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [
          { data: clientData, error: clientError },
          { data: eventsData, error: eventsError },
          { data: invoicesData, error: invoicesError },
          { data: receiptsData, error: receiptsError },
        ] = await Promise.all([
          supabase.from('client_table').select('*').eq('id', clientId).single(),
          supabase.from('events').select('*').eq('client_id', clientId).order('date', { ascending: true }),
          supabase.from('invoices').select('*').eq('client_id', clientId).order('issue_date', { ascending: true }),
          supabase.from('receipts').select('*').eq('client_id', clientId).order('receipt_date', { ascending: true }),
        ]);

        if (clientError) {
          throw clientError;
        }

        if (eventsError) {
          throw eventsError;
        }

        if (invoicesError) {
          throw invoicesError;
        }

        if (receiptsError) {
          throw receiptsError;
        }

        setClient(clientData);
        setEvents(eventsData || []);
        setInvoices(invoicesData || []);
        setReceipts(receiptsData || []);
      } catch (fetchError) {
        console.error('Error fetching client detail:', fetchError);
        setError(getSupabaseErrorMessage(fetchError, 'Unable to load client details right now.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientDetail();
  }, [clientId]);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
    const totalReceived = receipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);

    return {
      totalBilled,
      totalReceived,
      pendingAmount: Math.max(totalBilled - totalReceived, 0),
    };
  }, [invoices, receipts]);

  const upcomingEvents = useMemo(() => {
    const today = getTodayString();

    return events.filter((event) => event.date >= today && event.status === 'PENDING');
  }, [events]);

  const ledgerEntries = useMemo(() => {
    const invoiceEntries = invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      date: invoice.issue_date,
      type: 'Invoice',
      particulars: invoice.invoice_number || 'Invoice entry',
      notes: invoice.notes,
      debit: Number(invoice.total_amount || 0),
      credit: 0,
    }));

    const receiptEntries = receipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      date: receipt.receipt_date,
      type: 'Receipt',
      particulars: receipt.account || receipt.mode || 'Receipt entry',
      notes: receipt.notes,
      debit: 0,
      credit: Number(receipt.amount || 0),
    }));

    const orderedEntries = [...invoiceEntries, ...receiptEntries].sort((first, second) => {
      if (first.date === second.date) {
        return first.type.localeCompare(second.type);
      }

      return first.date.localeCompare(second.date);
    });

    let balance = 0;

    return orderedEntries.map((entry) => {
      balance += entry.debit - entry.credit;

      return {
        ...entry,
        balance,
      };
    });
  }, [invoices, receipts]);

  const detailCards = client
    ? [
        { label: 'Client Name', value: client.name || '-', icon: UserRound },
        { label: 'Brand Name', value: client.brand_name || '-', icon: UserRound },
        { label: 'Phone', value: client.phone || '-', icon: Phone },
        { label: 'Location', value: client.location || '-', icon: MapPin },
        { label: 'Plan', value: client.plan_type || '-', icon: CreditCard },
        { label: 'Plan Price', value: formatCurrency(client.plan_price), icon: IndianRupee },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {client?.name || 'Client Details'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review profile details, upcoming events, and the account ledger in one place.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
          Loading client details...
        </div>
      ) : client ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">Client Details</h2>
              <p className="mt-1 text-sm text-slate-500">Primary profile and billing information.</p>
            </div>

            <div className="px-6 py-6">
              <div className="mb-5">
                <p className="text-sm text-slate-600">
                  <strong>Total Billed:</strong> {formatCurrency(summary.totalBilled)} | 
                  <strong> Total Received:</strong> {formatCurrency(summary.totalReceived)} | 
                  <strong> Pending:</strong> {formatCurrency(summary.pendingAmount)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {detailCards.map(({ label, value }) => (
                  <div key={label} className="text-sm">
                    <strong>{label}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">Pending Calendar Events</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upcoming shoots, meetings, and tasks linked to this client.
              </p>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 py-6">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="min-w-[260px] rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeBadgeClass(event.type)}`}>
                        {event.type}
                      </span>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {formatDate(event.date)}
                      </p>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatTime(event.time)}</p>
                    {event.notes ? (
                      <p className="mt-3 text-sm leading-6 text-slate-500">{event.notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No pending calendar events</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Upcoming items linked to this client will show here.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">Account Ledger</h2>
              <p className="mt-1 text-sm text-slate-500">
                Total billed {formatCurrency(summary.totalBilled)}, received {formatCurrency(summary.totalReceived)}, pending {formatCurrency(summary.pendingAmount)}.
              </p>
            </div>

            {ledgerEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/50">
                    <tr>
                      {['Date', 'Entry', 'Particulars', 'Debit', 'Credit', 'Balance'].map((heading) => (
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
                    {ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(entry.date)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            entry.type === 'Invoice'
                              ? 'bg-blue-50 text-blue-700 ring-blue-700/10'
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-700/10'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <p className="font-medium text-slate-900">{entry.particulars}</p>
                          {entry.notes ? <p className="mt-1 text-xs text-slate-500">{entry.notes}</p> : null}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-10 text-sm text-slate-500">No ledger entries for this client yet.</div>
            )}
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
          Client not found.
        </div>
      )}
    </div>
  );
}

function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function formatTime(time) {
  if (!time) {
    return '-';
  }

  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
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

function getTypeBadgeClass(type) {
  if (type === 'Shoot') {
    return 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200';
  }

  if (type === 'Meeting') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
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

export default ClientDetail;
