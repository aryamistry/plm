import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useProducts, useCreateProduct, useArchiveProduct } from '../../hooks/useProducts';
import useAuthStore from '../../store/authStore';
import { canCreateProduct, canArchiveProduct } from '../../utils/permissions';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { formatPrice, formatVersion, formatDate } from '../../utils/formatters';

export default function ProductList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(user?.role === 'operations' ? 'ACTIVE' : '');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [archiveId, setArchiveId] = useState(null);
  const [form, setForm] = useState({ name: '', sale_price: '', cost_price: '', attachments: '' });

  const { data, isLoading } = useProducts({ status: status || undefined, page, limit: 20 });
  const createMutation = useCreateProduct();
  const archiveMutation = useArchiveProduct();

  const products = (data?.data || []).filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { header: '#', cell: (row) => <span className="font-display text-text-muted">{row.id}</span> },
    { header: 'Product Name', cell: (row) => <span className="text-text-primary font-medium">{row.name}</span> },
    { header: 'Version', cell: (row) => <span className="font-display text-accent-blue">{formatVersion(row.current_version?.version)}</span> },
    { header: 'Sale Price', cell: (row) => <span className="font-display">{formatPrice(row.current_version?.sale_price)}</span> },
    { header: 'Cost Price', cell: (row) => <span className="font-display">{formatPrice(row.current_version?.cost_price)}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.current_version?.status} /> },
    { header: 'Created', cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span> },
    {
      header: 'Actions', cell: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/products/${row.id}`)} className="text-xs text-accent-blue hover:underline">View</button>
          {canArchiveProduct(user) && row.current_version?.status === 'ACTIVE' && (
            <button onClick={() => setArchiveId(row.id)} className="text-xs text-accent-red hover:underline">Archive</button>
          )}
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      name: form.name,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      cost_price: form.cost_price ? Number(form.cost_price) : null,
      attachments: form.attachments || null,
    });
    setShowCreate(false);
    setForm({ name: '', sale_price: '', cost_price: '', attachments: '' });
  };

  return (
    <div>
      <PageHeader title="Products">
        {canCreateProduct(user) && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
            <Plus size={16} /> New Product
          </button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full bg-bg-surface border border-bg-border rounded-input pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
        </div>
        {user?.role !== 'operations' && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        )}
      </div>

      <DataTable columns={columns} data={products} isLoading={isLoading}
        pagination={data?.pagination} onPageChange={setPage} />

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative bg-bg-surface border border-bg-border rounded-card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">New Product</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Product Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Sale Price</label>
                  <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                    className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Cost Price</label>
                  <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Attachments</label>
                <input value={form.attachments} onChange={(e) => setForm({ ...form, attachments: e.target.value })}
                  className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" placeholder="URL or file path" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary bg-bg-elevated border border-bg-border rounded-input">Cancel</button>
              <button onClick={handleCreate} disabled={!form.name || createMutation.isPending}
                className="px-4 py-2 text-sm bg-accent-blue text-white rounded-input hover:bg-accent-blue-dim disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!archiveId} onClose={() => setArchiveId(null)} onConfirm={() => archiveMutation.mutateAsync(archiveId)}
        title="Archive Product" description="All versions will be archived. This product will no longer be available for new BoMs or ECOs."
        confirmLabel="Archive" variant="danger" />
    </div>
  );
}
