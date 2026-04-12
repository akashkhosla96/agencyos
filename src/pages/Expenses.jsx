import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Eye, Pencil, Printer, Trash } from 'lucide-react';
import AddExpenseModal from '../modal/AddExpenseModal';
import { supabase } from '../services/supabaseClient';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      setError('');

      try {
        const { data, error: fetchError } = await supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false });

        if (fetchError) throw fetchError;

        setExpenses(data || []);
      } catch (err) {
        console.error('Error fetching expenses:', err);
          setError('Unable to load expenses right now.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [expenses]);

  const handleSaveExpense = async (expenseData) => {
    setIsSaving(true);
    setError('');

    const payload = {
      expense_date: expenseData.expenseDate,
      expense_head: expenseData.expenseHead.trim(),
      account: expenseData.expenseAccount.trim(),
      amount: Number(expenseData.amount),
      mode: expenseData.mode,
      notes: expenseData.notes?.trim() || null,
    };

    try {
      if (expenseData.id) {
        const { data, error: updateError } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', expenseData.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setExpenses((current) => current.map((p) => (p.id === data.id ? data : p)));
      } else {
        const { data, error: insertError } = await supabase
          .from('expenses')
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;

        setExpenses((current) => [data, ...current]);
      }

      setIsModalOpen(false);
      setEditingExpense(null);
      setIsViewing(false);
    } catch (saveError) {
      console.error('Error saving expense:', saveError);
      setError('Unable to save expense right now.');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    const confirmed = window.confirm('Delete this expense entry? This action cannot be undone.');
    if (!confirmed) return;

    setError('');
    try {
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
      if (deleteError) throw deleteError;

      setExpenses((current) => current.filter((p) => p.id !== id));
    } catch (deleteErr) {
      console.error('Error deleting expense:', deleteErr);
      setError('Unable to delete expense right now.');
    }
  };

  const handlePrintExpense = (payment) => {
    const content = `
      <html>
        <head><title>Expense</title></head>
        <body>
          <h2>Expense</h2>
          <p><strong>Date:</strong> ${formatDate(payment.expense_date)}</p>
          <p><strong>Expense Head:</strong> ${payment.expense_head || ''}</p>
          <p><strong>Expense Account:</strong> ${payment.account || ''}</p>
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Money Out (Expenses)</h1>
            <p className="mt-1 text-sm text-slate-500">Record outgoing expenses quickly with simple tagging.</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setIsViewing(false);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-900">Expenses Register</h2>
            {expenses.length > 0 ? (
              <>
              </>
            ) : null}
          </div>

          {error ? (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">{error}</div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading expenses...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    {['Date', 'Expense Head', 'Expense Account', 'Amount', 'Mode', 'Notes'].map((heading) => (
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
                  {expenses.map((payment) => (
                    <tr key={payment.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {formatDate(payment.expense_date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {payment.expense_head || '-'}
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
                              setEditingExpense(payment);
                              setIsViewing(true);
                              setIsModalOpen(true);
                            }}
                            aria-label={`View expense ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(payment);
                              setIsViewing(false);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Edit expense ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(payment.id)}
                            aria-label={`Delete expense ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-rose-600"
                          >
                            <Trash className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePrintExpense(payment)}
                            aria-label={`Print expense ${payment.id}`}
                            className="rounded-md text-slate-400 transition-colors hover:text-emerald-600"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-300">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        initialData={editingExpense}
        readOnly={isViewing}
        onDelete={handleDeleteExpense}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
          setIsViewing(false);
        }}
        onSave={handleSaveExpense}
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

export default Expenses;
