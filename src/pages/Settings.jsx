import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AddSeriesModal from '../modal/AddSeriesModal';
import AddServiceModal from '../modal/AddServiceModal';
import { supabase } from '../services/supabaseClient';

function Settings() {
  const [invoiceSeries, setInvoiceSeries] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seriesError, setSeriesError] = useState('');
  const [servicesError, setServicesError] = useState('');
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isSavingSeries, setIsSavingSeries] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const currentFinancialYear = getCurrentFinancialYear();

  useEffect(() => {
    const fetchSettingsData = async () => {
      setIsLoading(true);
      setSeriesError('');
      setServicesError('');

      try {
        const [
          { data: rawSeriesData, error: seriesFetchError },
          { data: servicesData, error: servicesFetchError },
        ] = await Promise.all([
          supabase
            .from('invoice_series')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase.from('services').select('*').order('name', { ascending: true }),
        ]);

        if (seriesFetchError) {
          throw { scope: 'series', ...seriesFetchError };
        }

        if (servicesFetchError) {
          throw { scope: 'services', ...servicesFetchError };
        }

        const syncedSeriesData = await syncInvoiceSeriesFinancialYear(
          rawSeriesData || [],
          currentFinancialYear,
        );

        setInvoiceSeries(syncedSeriesData);
        setServices(servicesData || []);
      } catch (fetchError) {
        console.error('Error fetching settings data:', fetchError);

        if (fetchError.scope === 'services') {
          setServicesError(getSupabaseErrorMessage(fetchError, 'Unable to load services right now.'));
        } else {
          setSeriesError(
            getSupabaseErrorMessage(fetchError, 'Unable to load invoice series right now.'),
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettingsData();
  }, [currentFinancialYear]);

  const handleOpenAddSeries = () => {
    setEditingSeries(null);
    setSeriesError('');
    setIsSeriesModalOpen(true);
  };

  const handleEditSeries = (series) => {
    setEditingSeries(series);
    setSeriesError('');
    setIsSeriesModalOpen(true);
  };

  const handleCloseSeriesModal = () => {
    setEditingSeries(null);
    setIsSeriesModalOpen(false);
  };

  const handleSaveSeries = async (seriesData) => {
    setIsSavingSeries(true);
    setSeriesError('');

    const code = seriesData.code.trim().toUpperCase();
    const prefix = buildPrefix(code, currentFinancialYear);

    try {
      if (editingSeries) {
        const payload = {
          name: seriesData.name.trim(),
          code,
          current_financial_year: currentFinancialYear,
          current_number: editingSeries.current_financial_year !== currentFinancialYear ? 0 : parseCurrentNumber(seriesData.currentNumber),
          prefix,
        };

        const { data, error } = await supabase
          .from('invoice_series')
          .update(payload)
          .eq('id', editingSeries.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setInvoiceSeries((currentSeries) =>
          currentSeries.map((series) => (series.id === editingSeries.id ? data : series)),
        );
      } else {
        const payload = {
          name: seriesData.name.trim(),
          code,
          current_financial_year: currentFinancialYear,
          current_number: parseCurrentNumber(seriesData.currentNumber),
          prefix,
        };

        const { data, error } = await supabase
          .from('invoice_series')
          .insert([payload])
          .select()
          .single();

        if (error) {
          throw error;
        }

        setInvoiceSeries((currentSeries) => [data, ...currentSeries]);
      }

      setIsSeriesModalOpen(false);
      setEditingSeries(null);
    } catch (saveError) {
      console.error('Error saving invoice series:', saveError);
      const message = getSupabaseErrorMessage(saveError, 'Unable to save invoice series right now.');
      setSeriesError(message);
      throw saveError;
    } finally {
      setIsSavingSeries(false);
    }
  };

  const handleSaveService = async (serviceData) => {
    setIsSavingService(true);
    setServicesError('');

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ name: serviceData.name.trim() }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setServices((currentServices) =>
        [...currentServices, data].sort((first, second) => first.name.localeCompare(second.name)),
      );
      setIsServiceModalOpen(false);
    } catch (saveError) {
      console.error('Error saving service:', saveError);
      const message = getSupabaseErrorMessage(saveError, 'Unable to save service right now.');
      setServicesError(message);
      throw saveError;
    } finally {
      setIsSavingService(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure invoice series and service options used across the ERP.
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Invoice Series</h2>
              <p className="mt-1 text-sm text-slate-500">
                {invoiceSeries.length} configured numbering series
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSeries}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              Add Series
            </button>
          </div>

          {seriesError ? (
            <div className="border-b border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">
              {seriesError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading invoice series...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    {[
                      'Name',
                      'Code',
                      'Financial Year',
                      'Current Number',
                      'Prefix',
                      'Action',
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
                  {invoiceSeries.map((series) => (
                    <tr key={series.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {series.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {series.code}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {series.current_financial_year}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {series.current_number}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {series.prefix}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          type="button"
                          onClick={() => handleEditSeries(series)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoiceSeries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                        No invoice series configured yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Services</h2>
              <p className="mt-1 text-sm text-slate-500">{services.length} active service items</p>
            </div>
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-4 w-4" />
              Add Service
            </button>
          </div>

          {servicesError ? (
            <div className="border-b border-slate-200 bg-rose-50 px-6 py-3 text-sm text-rose-600">
              {servicesError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-10 text-sm text-slate-500">Loading services...</div>
          ) : (
            <div className="px-6 py-6">
              <div className="flex flex-wrap gap-2">
                {services.length > 0 ? (
                  services.map((service) => (
                    <span
                      key={service.id}
                      className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10"
                    >
                      {service.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No services added yet.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <AddSeriesModal
        isOpen={isSeriesModalOpen}
        onClose={handleCloseSeriesModal}
        onSave={handleSaveSeries}
        isSaving={isSavingSeries}
        error={seriesError}
        initialSeries={editingSeries}
        currentFinancialYear={currentFinancialYear}
      />

      <AddServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        isSaving={isSavingService}
        error={servicesError}
      />
    </>
  );
}

async function syncInvoiceSeriesFinancialYear(seriesRows, currentFinancialYear) {
  const staleRows = seriesRows.filter(
    (series) => series.current_financial_year !== currentFinancialYear,
  );

  if (staleRows.length === 0) {
    return seriesRows;
  }

  const syncedRows = await Promise.all(
    staleRows.map(async (series) => {
      const payload = {
        current_financial_year: currentFinancialYear,
        current_number: 0,
        prefix: buildPrefix(series.code, currentFinancialYear),
      };

      const { data, error } = await supabase
        .from('invoice_series')
        .update(payload)
        .eq('id', series.id)
        .select()
        .single();

      if (error) {
        throw { scope: 'series', ...error };
      }

      return data;
    }),
  );

  const syncedRowsById = syncedRows.reduce((lookup, row) => {
    lookup[row.id] = row;
    return lookup;
  }, {});

  return seriesRows.map((series) => syncedRowsById[series.id] || series);
}

function buildPrefix(code, financialYear) {
  return `${String(code).trim().toUpperCase()}/${financialYear}`;
}

function parseCurrentNumber(value) {
  const numericValue = Number(String(value).replace(/[^0-9]/g, ''));
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function getCurrentFinancialYear(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
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

export default Settings;
