import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useCreateBom } from '../../hooks/useBoms';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Trash2 } from 'lucide-react';

export default function BomCreate() {
  const navigate = useNavigate();
  const { data: productsData } = useProducts({ status: 'ACTIVE', limit: 100 });
  const createBom = useCreateBom();

  const [productId, setProductId] = useState('');
  const [components, setComponents] = useState([{ component_product_id: '', quantity: 1 }]);
  const [operations, setOperations] = useState([]);

  const products = productsData?.data || [];

  const addComponent = () => setComponents([...components, { component_product_id: '', quantity: 1 }]);
  const removeComponent = (i) => setComponents(components.filter((_, idx) => idx !== i));
  const updateComponent = (i, field, value) => {
    const updated = [...components];
    updated[i][field] = field === 'quantity' || field === 'component_product_id' ? Number(value) : value;
    setComponents(updated);
  };

  const addOperation = () => setOperations([...operations, { operation_name: '', time_minutes: 0, work_center: '' }]);
  const removeOperation = (i) => setOperations(operations.filter((_, idx) => idx !== i));
  const updateOperation = (i, field, value) => {
    const updated = [...operations];
    updated[i][field] = field === 'time_minutes' ? Number(value) : value;
    setOperations(updated);
  };

  const handleSubmit = async () => {
    const data = {
      product_id: Number(productId),
      components: components.filter(c => c.component_product_id),
      operations: operations.filter(o => o.operation_name),
    };
    const res = await createBom.mutateAsync(data);
    if (res?.data?.data?.id) navigate(`/boms/${res.data.data.id}`);
    else navigate('/boms');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Create Bill of Materials" backTo="/boms" backLabel="Back to BoMs" />

      {/* Product Selection */}
      <div className="bg-bg-surface border border-bg-border rounded-card p-4 mb-4">
        <h3 className="text-sm font-display text-text-muted uppercase mb-3">BoM Info</h3>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Product *</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}
            className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
            <option value="">Select a product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <p className="text-xs text-text-muted mt-2 font-display">Version: v1 (auto-assigned)</p>
      </div>

      {/* Components */}
      <div className="bg-bg-surface border border-bg-border rounded-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display text-text-muted uppercase">Components</h3>
          <button onClick={addComponent} className="flex items-center gap-1 text-xs text-accent-blue hover:underline">
            <Plus size={14} /> Add Component
          </button>
        </div>
        <div className="space-y-2">
          {components.map((comp, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={comp.component_product_id} onChange={(e) => updateComponent(i, 'component_product_id', e.target.value)}
                className="flex-1 bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
                <option value="">Select component</option>
                {products.filter(p => p.id !== Number(productId)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" value={comp.quantity} onChange={(e) => updateComponent(i, 'quantity', e.target.value)} min="1"
                className="w-20 bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary text-center" placeholder="Qty" />
              {components.length > 1 && (
                <button onClick={() => removeComponent(i)} className="text-text-muted hover:text-accent-red p-1"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Operations */}
      <div className="bg-bg-surface border border-bg-border rounded-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display text-text-muted uppercase">Operations (optional)</h3>
          <button onClick={addOperation} className="flex items-center gap-1 text-xs text-accent-blue hover:underline">
            <Plus size={14} /> Add Operation
          </button>
        </div>
        <div className="space-y-2">
          {operations.map((op, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={op.operation_name} onChange={(e) => updateOperation(i, 'operation_name', e.target.value)} placeholder="Operation name"
                className="flex-1 bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
              <input type="number" value={op.time_minutes} onChange={(e) => updateOperation(i, 'time_minutes', e.target.value)} placeholder="Minutes" min="0"
                className="w-24 bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary text-center" />
              <input value={op.work_center} onChange={(e) => updateOperation(i, 'work_center', e.target.value)} placeholder="Work Center"
                className="w-28 bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
              <button onClick={() => removeOperation(i)} className="text-text-muted hover:text-accent-red p-1"><Trash2 size={14} /></button>
            </div>
          ))}
          {operations.length === 0 && <p className="text-xs text-text-muted">No operations added.</p>}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!productId || createBom.isPending}
        className="bg-accent-blue hover:bg-accent-blue-dim text-white px-6 py-2.5 rounded-input text-sm font-medium disabled:opacity-50 transition-colors">
        {createBom.isPending ? 'Creating...' : 'Create BoM'}
      </button>
    </div>
  );
}
