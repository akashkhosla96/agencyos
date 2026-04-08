import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Eye, Pencil, Printer, Trash } from 'lucide-react';
import AddPaymentModal from '../modal/AddPaymentModal';
import { supabase } from '../services/supabaseClient';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      setError('');

      try {
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false });

        if (fetchError) throw fetchError;

        setPayments(data || []);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Unable to load payments right now.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const totalPayments = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const handleSavePayment = async (paymentData) => {
    setIsSaving(true);
    setError('');

    const payload = {
      payment_date: paymentData.paymentDate,
      account: paymentData.account.trim(),
      amount: Number(paymentData.amount),
      mode: paymentData.mode,
      notes: paymentData.notes?.trim() || null,
    };

    try {
      if (paymentData.id) {
        const { data, error: updateError } = await supabase
          .from('payments')
          .update(payload)
          .eq('id', paymentData.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setPayments((current) => current.map((p) => (p.id === data.id ? data : p)));
      } else {
        const { data, error: insertError } = await supabase
          .from('payments')
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;

        setPayments((current) => [data, ...current]);
      }

      setIsModalOpen(false);
      setEditingPayment(null);
      setIsViewing(false);
    } catch (saveError) {
      console.error('Error saving payment:', saveError);
      setError('Unable to save payment right now.');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async (id) => {
    const confirmed = window.confirm('Delete this payment entry? This action cannot be undone.');
    if (!confirmed) return;

    setError('');
    try {
      const { error: deleteError } = await supabase.from('payments').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setPayments((current) => current.filter((p) => p.id !== id));
    } catch (deleteErr) {
      console.error('Error deleting payment:', deleteErr);
      setError('Unable to delete payment right now.');
    }
  };

  const handlePrintPayment = (payment) => {
    const content = `
      <html>
        <head><title>Payment</title></head>
        <body>
          <h2>Payment</h2>
          <p><strong>Date:</strong> ${formatDate(payment.payment_date)}</p>
          <p><strong>Account:</strong> ${payment.account || ''}</p>
          <p><strong>Amount:</strong> Rs. ${new Intl.NumberFormat('en-IN').format(Number(payment.amount || 0))}</p>
          <p><strong>Mode:</strong> ${payment.mode || ''}</p>
          <p><strong>Notes:</strong> ${payment.notes || ''}</p>
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Money Out (Payments)</h1>
            <p className="mt-1 text-sm text-slate-500">Record outgoing payments quickly with simple tagging.</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setEditingPayment(null);
                setIsViewing(false);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              Add Payment
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-900">Payments Register</h2>
            {payments.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-slate-500">{payments.length} payment records</p>
                <div className="mt-2 text-sm font-semibold">Total: Rs. {new Intl.NumberFormat('en-IN').format(totalPayments)}</div>
              </>
            ) : null}
          </div>

          {error ? (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">{error}</div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading payments...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    {['Date', 'Account', 'Amount', 'Mode', 'Notes'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {payment.account}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        Rs. {new Intl.NumberFormat('en-IN').format(Number(payment.amount || 0))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {payment.mode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{payment.notes || '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(payment);
                              setIsViewing(true);
                              setIsModalOpen(true);
                            }}
                            aria-label={`View payment ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(payment);
                              setIsViewing(false);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Edit payment ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePayment(payment.id)}
                            aria-label={`Delete payment ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-rose-600"
                          >
                            <Trash className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintPayment(payment)}
                            aria-label={`Print payment ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-emerald-600"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-300">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AddPaymentModal
        isOpen={isModalOpen}
        initialData={editingPayment}
        readOnly={isViewing}
        onDelete={handleDeletePayment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPayment(null);
          setIsViewing(false);
        }}
        onSave={handleSavePayment}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getSupabaseErrorMessage(error, fallbackMessage) {
  if (error?.message) return error.message;
  if (error?.details) return error.details;
  return fallbackMessage;
}

export default Payments;
