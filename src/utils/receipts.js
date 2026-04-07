import { supabase } from '../services/supabaseClient';

export async function getTotalReceivedByClient(clientId) {
  if (!clientId) {
    return 0;
  }

  const { data, error } = await supabase
    .from('receipts')
    .select('amount')
    .eq('client_id', clientId);

  if (error) {
    throw error;
  }

  return (data || []).reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
}
