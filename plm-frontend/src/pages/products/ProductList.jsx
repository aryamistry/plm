import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCreateProduct } from '../../hooks/useProducts';
import useAuthStore from '../../store/authStore';
import { canCreateProduct, canArchiveProduct } from '../../utils/permissions';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatPrice, formatVersion } from '../../utils/formatters';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductList() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useProducts({ status: status || undefined, search: search || undefined });
  const createMutation = useCreateProduct();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ product_code: '', name: '', sale_price: '', cost_price: '', attachments: '' });

  useEffect(() => { document.title = 'Products — PLM'; }, []);

  const products = data?.data || [];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        product_code: form.product_code,
        name: form.name,
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        attachments: form.attachments || null,
      });
      toast.success('Product created');
      setShowCreate(false);
      setForm({ product_code: '', name: '', sale_price: '', cost_price: '', attachments: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create product');
    }
  };

  const columns = [
    { header: 'Code', cell: (row) => <span className="font-display text-accent-cyan text-xs">{row.product_code}</span> },
    { header: 'Name', cell: (row) => (
      <Link to={`/products/${row.id}`} className="text-accent-blue hover:underline font-medium">{row.name}</Link>
    )},
    { header: 'Version', cell: (row) => <span className="font-display">{formatVersion(row.current_version?.version)}</span> },
    { header: 'Sale Price', cell: (row) => <span className="font-display">{formatPrice(row.current_version?.sale_price)}</span> },
    { header: 'Cost Price', cell: (row) => <span className="font-display">{formatPrice(row.current_version?.cost_price)}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.current_version?.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Products" description={`${products.length} products`}>
        {canCreateProduct(user) && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
            <Plus size={16} /> New Product
          </button>
        )}
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code..."
            className="w-full bg-bg-surface border border-bg-border rounded-input pl-8 pr-3 py-2 text-sm text-text-primary" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="bg-bg-surface border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <DataTable columns={columns} data={products} isLoading={isLoading} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-bg-surface border border-bg-border rounded-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary">Create New Product</h3>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted uppercase font-display mb-1">Product Code *</label>
                <input value={form.product_code} onChange={e => setForm({...form, product_code: e.target.value})}
                  placeholder="e.g. PROD-001"
                  className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
              </div>
              <div>
                <label className="block text-xs text-text-muted uppercase font-display mb-1">Product Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Wooden Table"
                  className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted uppercase font-display mb-1">Sale Price</label>
                  <input type="number" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase font-display mb-1">Cost Price</label>
                  <input type="number" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted uppercase font-display mb-1">Attachments (URL/note)</label>
                <input value={form.attachments} onChange={e => setForm({...form, attachments: e.target.value})}
                  placeholder="Optional"
                  className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.product_code}
                className="bg-accent-blue text-white px-4 py-2 rounded-input text-sm font-medium disabled:opacity-50 transition-colors">
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
              </button>
              <button onClick={() => setShowCreate(false)} className="text-text-muted text-sm px-4 py-2 hover:text-text-primary transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
