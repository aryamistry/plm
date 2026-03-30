import { useState } from 'react';
import { useEcoReport } from '../../hooks/useReports';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/formatters';

export default function EcoReport() {
  const [filters, setFilters] = useState({ type: '', status: '', from: '', to: '' });
  const { data, isLoading } = useEcoReport(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));

  const ecos = data?.data || [];

  const columns = [
    { header: 'Title', cell: (row) => <span className="font-medium text-text-primary">{row.title}</span> },
    { header: 'Type', cell: (row) => <StatusBadge status={row.type} /> },
    { header: 'Product', cell: (row) => <span className="text-text-secondary">{row.product_name}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Stage', cell: (row) => <span className="text-xs font-display text-text-muted">{row.stage_name}</span> },
    { header: 'Changes', cell: (row) => <span className="text-xs text-text-muted">{row.changes_summary}</span> },
    { header: 'Created', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="ECO Report" />
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
          <option value="">All Types</option><option value="PRODUCT">Product</option><option value="BOM">BoM</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
          <option value="">All Statuses</option><option value="NEW">New</option><option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option><option value="REJECTED">Rejected</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} placeholder="From"
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} placeholder="To"
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
      </div>
      <DataTable columns={columns} data={ecos} isLoading={isLoading} />
    </div>
  );
}
