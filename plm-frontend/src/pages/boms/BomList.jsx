import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useBoms } from '../../hooks/useBoms';
import useAuthStore from '../../store/authStore';
import { canCreateBom } from '../../utils/permissions';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatVersion, formatDate } from '../../utils/formatters';

export default function BomList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useBoms({ status: status || undefined, page, limit: 20 });
  const boms = data?.data || [];

  const columns = [
    { header: 'BoM ID', cell: (row) => <span className="font-display text-text-muted">#{row.id}</span> },
    { header: 'Product', cell: (row) => <span className="text-text-primary">{row.product_name}</span> },
    { header: 'Version', cell: (row) => <span className="font-display text-accent-blue">{formatVersion(row.current_version?.version)}</span> },
    { header: 'Components', cell: (row) => <span className="font-display text-sm">{row.current_version?.components?.length || 0}</span> },
    { header: 'Operations', cell: (row) => <span className="font-display text-sm">{row.current_version?.operations?.length || 0}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.current_version?.status} /> },
    { header: 'Created', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
    { header: 'Actions', cell: (row) => <Link to={`/boms/${row.id}`} className="text-xs text-accent-blue hover:underline">View</Link> },
  ];

  return (
    <div>
      <PageHeader title="Bills of Materials">
        {canCreateBom(user) && (
          <button onClick={() => navigate('/boms/create')} className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
            <Plus size={16} /> New BoM
          </button>
        )}
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <DataTable columns={columns} data={boms} isLoading={isLoading}
        pagination={data?.pagination} onPageChange={setPage} />
    </div>
  );
}
