import { supabase } from '../services/supabaseClient';

export async function generateNextInvoiceNumber(seriesId) {
  const { data: series, error: seriesError } = await supabase
    .from('invoice_series')
    .select('id, prefix, current_number')
    .eq('id', seriesId)
    .single();

  if (seriesError) {
    throw seriesError;
  }

  if (!series) {
    throw new Error('Selected invoice series was not found.');
  }

  const nextNumber = Number(series.current_number || 0) + 1;
  const paddedNumber = String(nextNumber).padStart(3, '0');
  const invoiceNumber = `${series.prefix}/${paddedNumber}`;

  const { data: existingInvoice, error: duplicateError } = await supabase
    .from('invoices')
    .select('id')
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();

  if (duplicateError) {
    throw duplicateError;
  }

  if (existingInvoice) {
    throw new Error(`Invoice number ${invoiceNumber} already exists.`);
  }

  return {
    series,
    nextNumber,
    paddedNumber,
    invoiceNumber,
  };
}
