const statCards = [
  { label: 'Active Clients', value: '24', detail: '4 added this month' },
  { label: 'Scheduled Events', value: '18', detail: '6 due this week' },
  { label: 'Pending Invoices', value: 'Rs. 2.4L', detail: 'Across 7 accounts' },
];

const upcomingItems = [
  {
    title: 'Summer campaign shoot',
    meta: 'Glow Media Co. • Today at 10:00 AM',
  },
  {
    title: 'Brand review meeting',
    meta: 'Cafe Delhi • Today at 2:00 PM',
  },
  {
    title: 'Website planning session',
    meta: 'Glow Media Co. • April 9',
  },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/70"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/70">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Overview
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            Keep operations moving without leaving the dashboard
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Use the sidebar to move between client management and calendar planning. This
            shared layout gives the app a true ERP structure while keeping your existing
            module logic intact.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/70">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Upcoming
          </p>
          <div className="mt-4 space-y-3">
            {upcomingItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
