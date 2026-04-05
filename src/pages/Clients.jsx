import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddClientModal from '../modal/AddClientModal';

const initialClients = [
  {
    id: 1,
    name: 'Aarav Sharma',
    brand: 'Glow Media Co.',
    phone: '+91 98765 43210',
    planType: 'Monthly',
    planPrice: 'Rs. 45,000',
    services: ['SMM', 'SHOOTS'],
    totalBilled: 'Rs. 1,24,000',
    pendingAmount: 'Rs. 18,000',
  },
  {
    id: 2,
    name: 'Riya Kapoor',
    brand: 'Luxe Studio',
    phone: '+91 98111 22446',
    planType: 'Custom',
    planPrice: 'Rs. 72,000',
    services: ['WEBSITE', 'GOOGLE LOCAL SEO'],
    totalBilled: 'Rs. 2,86,500',
    pendingAmount: 'Rs. 42,000',
  },
  {
    id: 3,
    name: 'Kabir Mehta',
    brand: 'Peak Performance',
    phone: '+91 98989 77661',
    planType: 'Per Shoot',
    planPrice: 'Rs. 28,000',
    services: ['SHOOTS'],
    totalBilled: 'Rs. 98,000',
    pendingAmount: 'Rs. 12,500',
  },
  {
    id: 4,
    name: 'Neha Verma',
    brand: 'The Bloom House',
    phone: '+91 98220 41875',
    planType: 'Monthly',
    planPrice: 'Rs. 36,000',
    services: ['SMM', 'GOOGLE LOCAL SEO'],
    totalBilled: 'Rs. 1,72,000',
    pendingAmount: 'Rs. 0',
  },
];

function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState(initialClients);

  const handleSaveClient = (clientData) => {
    const formattedPlanPrice = formatCurrency(clientData.planPrice);

    const newClient = {
      id: Date.now(),
      name: clientData.clientName,
      brand: clientData.brandName,
      phone: clientData.phoneNumber,
      planType: clientData.planType,
      planPrice: formattedPlanPrice,
      services: clientData.services,
      totalBilled: 'Rs. 0',
      pendingAmount: formattedPlanPrice,
    };

    setClients((currentClients) => [newClient, ...currentClients]);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Clean, Native Page Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your brand portfolio, track services, and monitor billing.
            </p>
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

        {/* Table Section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Client Directory</h2>
              <p className="mt-1 text-sm text-slate-500">{clients.length} active client records</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  {[
                    'Name',
                    'Brand',
                    'Phone',
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
                {clients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {client.name
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{client.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {client.brand}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {client.phone}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {client.planType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {client.planPrice}
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
                      {client.totalBilled}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        {client.pendingAmount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
      />
    </>
  );
}

function formatCurrency(value) {
  const numericValue = Number(String(value).replace(/[^0-9.]/g, ''));

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Rs. 0';
  }

  return `Rs. ${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(numericValue)}`;
}

export default Clients;