import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useEcos } from '../../hooks/useEcos';
import useAuthStore from '../../store/authStore';
import { canCreateEco } from '../../utils/permissions';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/formatters';

export default function EcoList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState(user?.role === 'operations' ? 'DONE' : '');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useEcos({ type: type || undefined, status: status || undefined, page, limit: 20 });
  const ecos = (data?.data || []).filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { header: 'Title', cell: (row) => <Link to={`/ecos/${row.id}`} className="text-accent-blue hover:underline font-medium">{row.title}</Link> },
    { header: 'Type', cell: (row) => <StatusBadge status={row.type} /> },
    { header: 'Product', cell: (row) => <span className="text-text-secondary">{row.product_name}</span> },
    { header: 'Stage', cell: (row) => <span className="text-xs font-display text-text-muted">{row.stage_name}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Created', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
    { header: 'Actions', cell: (row) => <Link to={`/ecos/${row.id}`} className="text-xs text-accent-blue hover:underline">View</Link> },
  ];

  return (
    <div>
      <PageHeader title="Engineering Change Orders">
        {canCreateEco(user) && (
          <button onClick={() => navigate('/ecos/create')} className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
            <Plus size={16} /> New ECO
          </button>
        )}
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ECOs..."
            className="w-full bg-bg-surface border border-bg-border rounded-input pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
          <option value="">All Types</option>
          <option value="PRODUCT">Product</option>
          <option value="BOM">BoM</option>
        </select>
        {user?.role !== 'operations' && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="REJECTED">Rejected</option>
          </select>
        )}
      </div>

      <DataTable columns={columns} data={ecos} isLoading={isLoading}
        pagination={data?.pagination} onPageChange={setPage} />
    </div>
  );
}
