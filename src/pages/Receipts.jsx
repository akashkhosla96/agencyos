import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Eye, Pencil, Printer, Trash } from 'lucide-react';
import AddReceiptModal from '../modal/AddReceiptModal';
import { supabase } from '../services/supabaseClient';
import { getTotalReceivedByClient } from '../utils/receipts';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceiptsData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [
          { data: receiptsData, error: receiptsError },
          { data: clientsData, error: clientsError },
        ] = await Promise.all([
          supabase.from('receipts').select('*').order('receipt_date', { ascending: false }),
          supabase.from('client_table').select('id, brand_name').order('brand_name', { ascending: true }),
        ]);

        if (receiptsError) {
          throw receiptsError;
        }

        if (clientsError) {
          throw clientsError;
        }

        setReceipts(receiptsData || []);
        setClients(clientsData || []);
      } catch (fetchError) {
        console.error('Error fetching receipts:', fetchError);
        setError(getSupabaseErrorMessage(fetchError, 'Unable to load receipts right now.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceiptsData();
  }, []);

  const clientsById = useMemo(
    () =>
      clients.reduce((lookup, client) => {
        lookup[client.id] = client;
        return lookup;
      }, {}),
    [clients],
  );

  const receiptsWithClientNames = useMemo(
    () =>
      receipts.map((receipt) => {
        const linkedClient = receipt.client_id ? clientsById[receipt.client_id] : null;

        return {
          ...receipt,
          clientName: linkedClient?.brand_name || '',
          accountName: receipt.account || linkedClient?.brand_name || '-',
        };
      }),
    [clientsById, receipts],
  );

  const summary = useMemo(() => {
    const totalAmount = receipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
    const linkedEntries = receipts.filter((receipt) => receipt.client_id).length;

    return {
      totalAmount,
      totalEntries: receipts.length,
      linkedEntries,
    };
  }, [receipts]);

  const handleSaveReceipt = async (receiptData) => {
    setIsSaving(true);
    setError('');

    const selectedClient = receiptData.clientId ? clientsById[receiptData.clientId] : null;

    const payload = {
      receipt_date: receiptData.receiptDate,
      account: selectedClient?.brand_name || receiptData.account.trim(),
      client_id: selectedClient?.id || null,
      amount: Number(receiptData.amount),
      mode: receiptData.mode,
      notes: normalizeOptionalText(receiptData.notes),
    };

    try {
      if (receiptData.id) {
        const { data, error: updateError } = await supabase
          .from('receipts')
          .update(payload)
          .eq('id', receiptData.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setReceipts((current) => current.map((r) => (r.id === data.id ? data : r)));
      } else {
        const { data, error: insertError } = await supabase
          .from('receipts')
          .insert([payload])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setReceipts((currentReceipts) => [data, ...currentReceipts]);
      }

      setIsModalOpen(false);
      setEditingReceipt(null);
    } catch (saveError) {
      console.error('Error saving receipt:', saveError);
      const message = getSupabaseErrorMessage(saveError, 'Unable to save receipt right now.');
      setError(message);
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReceipt = async (id) => {
    const confirm = window.confirm('Delete this receipt entry? This action cannot be undone.');
    if (!confirm) return;

    setIsSaving(true);
    setError('');

    try {
      const { error: deleteError } = await supabase.from('receipts').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setReceipts((current) => current.filter((r) => r.id !== id));
    } catch (deleteErr) {
      console.error('Error deleting receipt:', deleteErr);
      setError(getSupabaseErrorMessage(deleteErr, 'Unable to delete receipt right now.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReceipt = (receipt) => {
    const content = `
      <html>
        <head>
          <title>Receipt</title>
        </head>
        <body>
          <h2>Receipt</h2>
          <p><strong>Date:</strong> ${formatDate(receipt.receipt_date)}</p>
          <p><strong>Account:</strong> ${receipt.account || ''}</p>
          <p><strong>Client:</strong> ${receipt.clientName || ''}</p>
          <p><strong>Amount:</strong> ${formatCurrency(receipt.amount)}</p>
          <p><strong>Mode:</strong> ${receipt.mode || ''}</p>
          <p><strong>Notes:</strong> ${receipt.notes || ''}</p>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(content);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Money In (Receipts)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Record incoming payments quickly with optional client tagging for ledger tracking.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setEditingReceipt(null);
                setIsViewing(false);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              Add Entry
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-900">Receipt Register</h2>
            <p className="mt-1 text-sm text-slate-500">
             
            </p>
          </div>

          {error ? (
            <div className="border-b border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading receipts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    {['Date', 'Account', 'Client', 'Amount', 'Mode', 'Notes'].map((heading) => (
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
                  {receiptsWithClientNames.map((receipt) => (
                    <tr key={receipt.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(receipt.receipt_date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {receipt.accountName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {receipt.clientName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {formatCurrency(receipt.amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {receipt.mode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {receipt.notes?.trim() ? receipt.notes : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReceipt(receipt);
                              setIsViewing(true);
                              setIsModalOpen(true);
                            }}
                            aria-label={`View receipt ${receipt.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingReceipt(receipt);
                              setIsViewing(false);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Edit receipt ${receipt.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReceipt(receipt.id)}
                            aria-label={`Delete receipt ${receipt.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-rose-600"
                          >
                            <Trash className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(receipt)}
                            aria-label={`Print receipt ${receipt.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-emerald-600"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {receiptsWithClientNames.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                        No receipts posted yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AddReceiptModal
        isOpen={isModalOpen}
        initialData={editingReceipt}
        readOnly={isViewing}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReceipt(null);
          setIsViewing(false);
        }}
        onSave={handleSaveReceipt}
        onDelete={handleDeleteReceipt}
        clients={clients}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
}

export async function getClientLedgerReceiptTotal(clientId) {
  return getTotalReceivedByClient(clientId);
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

export default Receipts;
