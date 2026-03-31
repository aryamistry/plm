import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEco, useEcoDiff, useProposeChanges } from '../../hooks/useEcos';
import { useProduct } from '../../hooks/useProducts';
import { useBom } from '../../hooks/useBoms';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Save } from 'lucide-react';

export default function EcoProposeChanges() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: ecoData, isLoading } = useEco(id);
  const proposeMutation = useProposeChanges();

  const eco = ecoData?.data;
  const { data: productData } = useProduct(eco?.product_id);
  const { data: bomData } = useBom(eco?.bom_id);

  const product = productData?.data;
  const bom = bomData?.data;

  // Product form
  const [productForm, setProductForm] = useState({ new_sale_price: '', new_cost_price: '', new_attachments: '' });
  // BOM form
  const [componentChanges, setComponentChanges] = useState([]);
  const [operationChanges, setOperationChanges] = useState([]);

  // Initialize forms from current values
  useEffect(() => {
    if (eco?.type === 'PRODUCT' && product?.versions) {
      const active = product.versions.find(v => v.status === 'ACTIVE');
      if (active) {
        setProductForm({
          new_sale_price: active.sale_price ?? '',
          new_cost_price: active.cost_price ?? '',
          new_attachments: active.attachments ?? '',
        });
      }
    }
  }, [eco, product]);

  useEffect(() => {
    if (eco?.type === 'BOM' && bom?.active_version) {
      const av = bom.active_version;
      setComponentChanges((av.components || []).map(c => ({
        component_product_id: c.component_product_id,
        component_name: c.component_name,
        old_quantity: c.quantity,
        new_quantity: c.quantity,
      })));
      setOperationChanges((av.operations || []).map(o => ({
        operation_name: o.operation_name,
        work_center: o.work_center,
        old_time_minutes: o.time_minutes,
        new_time_minutes: o.time_minutes,
      })));
    }
  }, [eco, bom]);

  if (isLoading) return <LoadingSpinner />;
  if (!eco) return <div className="text-text-muted text-center py-8">ECO not found.</div>;
  if (eco.status !== 'NEW') return <div className="text-text-muted text-center py-8">Changes can only be proposed for NEW ECOs.</div>;

  const handleSaveProduct = async () => {
    await proposeMutation.mutateAsync({
      id: parseInt(id),
      data: {
        new_sale_price: productForm.new_sale_price ? Number(productForm.new_sale_price) : null,
        new_cost_price: productForm.new_cost_price ? Number(productForm.new_cost_price) : null,
        new_attachments: productForm.new_attachments || null,
      },
    });
    navigate(`/ecos/${id}`);
  };

  const handleSaveBom = async () => {
    await proposeMutation.mutateAsync({
      id: parseInt(id),
      data: {
        component_changes: componentChanges.map(c => ({
          component_product_id: c.component_product_id,
          new_quantity: Number(c.new_quantity),
        })),
        operation_changes: operationChanges.map(o => ({
          operation_name: o.operation_name,
          new_time_minutes: Number(o.new_time_minutes),
        })),
      },
    });
    navigate(`/ecos/${id}`);
  };

  const activeVersion = product?.versions?.find(v => v.status === 'ACTIVE');

  return (
    <div className="max-w-4xl">
      <PageHeader title={`Propose Changes — ${eco.title}`} backTo={`/ecos/${id}`} backLabel="Back to ECO" />

      {eco.type === 'PRODUCT' && (
        <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase font-display">Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase font-display">Current Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase font-display">Proposed Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-bg-border/30">
                <td className="px-4 py-3 text-sm font-display text-text-primary">Sale Price</td>
                <td className="px-4 py-3 text-sm font-display text-text-muted">{activeVersion?.sale_price ?? '—'}</td>
                <td className="px-4 py-3">
                  <input type="number" value={productForm.new_sale_price} onChange={(e) => setProductForm({ ...productForm, new_sale_price: e.target.value })}
                    className="bg-bg-elevated border border-bg-border rounded-input px-3 py-1.5 text-sm text-text-primary w-40 font-display" />
                </td>
              </tr>
              <tr className="border-b border-bg-border/30">
                <td className="px-4 py-3 text-sm font-display text-text-primary">Cost Price</td>
                <td className="px-4 py-3 text-sm font-display text-text-muted">{activeVersion?.cost_price ?? '—'}</td>
                <td className="px-4 py-3">
                  <input type="number" value={productForm.new_cost_price} onChange={(e) => setProductForm({ ...productForm, new_cost_price: e.target.value })}
                    className="bg-bg-elevated border border-bg-border rounded-input px-3 py-1.5 text-sm text-text-primary w-40 font-display" />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-display text-text-primary">Attachments</td>
                <td className="px-4 py-3 text-sm text-text-muted truncate max-w-[200px]">{activeVersion?.attachments ?? '—'}</td>
                <td className="px-4 py-3">
                  <input value={productForm.new_attachments} onChange={(e) => setProductForm({ ...productForm, new_attachments: e.target.value })}
                    className="bg-bg-elevated border border-bg-border rounded-input px-3 py-1.5 text-sm text-text-primary w-60" />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="p-4 border-t border-bg-border">
            <button onClick={handleSaveProduct} disabled={proposeMutation.isPending}
              className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-4 py-2 rounded-input text-sm font-medium disabled:opacity-50 transition-colors">
              <Save size={14} /> {proposeMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {eco.type === 'BOM' && (
        <div className="space-y-6">
          {/* Components */}
          <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border">
              <h3 className="text-sm font-display text-text-muted uppercase">Component Changes</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border bg-bg-elevated/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Component</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Current Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">New Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Change</th>
                </tr>
              </thead>
              <tbody>
                {componentChanges.map((c, i) => {
                  const diff = Number(c.new_quantity) - Number(c.old_quantity);
                  return (
                    <tr key={i} className="border-b border-bg-border/30">
                      <td className="px-4 py-2.5 text-sm text-text-primary">{c.component_name || `Product #${c.component_product_id}`}</td>
                      <td className="px-4 py-2.5 font-display text-sm text-text-muted">{c.old_quantity}</td>
                      <td className="px-4 py-2.5">
                        <input type="number" value={c.new_quantity} onChange={(e) => {
                          const updated = [...componentChanges];
                          updated[i].new_quantity = e.target.value;
                          setComponentChanges(updated);
                        }} min="0" className="bg-bg-elevated border border-bg-border rounded-input px-2 py-1 text-sm text-text-primary w-20 font-display text-center" />
                      </td>
                      <td className="px-4 py-2.5 font-display text-sm">
                        {diff !== 0 ? (
                          <span className={diff > 0 ? 'text-accent-green' : 'text-accent-red'}>
                            {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}
                          </span>
                        ) : <span className="text-text-muted">= 0</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Operations */}
          <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border">
              <h3 className="text-sm font-display text-text-muted uppercase">Operation Changes</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border bg-bg-elevated/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Operation</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Work Center</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Current (min)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">New (min)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Change</th>
                </tr>
              </thead>
              <tbody>
                {operationChanges.map((o, i) => {
                  const diff = Number(o.new_time_minutes) - Number(o.old_time_minutes);
                  return (
                    <tr key={i} className="border-b border-bg-border/30">
                      <td className="px-4 py-2.5 text-sm text-text-primary">{o.operation_name}</td>
                      <td className="px-4 py-2.5 text-sm text-text-muted">{o.work_center}</td>
                      <td className="px-4 py-2.5 font-display text-sm text-text-muted">{o.old_time_minutes}</td>
                      <td className="px-4 py-2.5">
                        <input type="number" value={o.new_time_minutes} onChange={(e) => {
                          const updated = [...operationChanges];
                          updated[i].new_time_minutes = e.target.value;
                          setOperationChanges(updated);
                        }} min="0" className="bg-bg-elevated border border-bg-border rounded-input px-2 py-1 text-sm text-text-primary w-20 font-display text-center" />
                      </td>
                      <td className="px-4 py-2.5 font-display text-sm">
                        {diff !== 0 ? (
                          <span className={diff > 0 ? 'text-accent-red' : 'text-accent-green'}>
                            {diff > 0 ? '+' : ''}{diff} min
                          </span>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {operationChanges.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-text-muted text-sm">No operations to change</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <button onClick={handleSaveBom} disabled={proposeMutation.isPending}
            className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-4 py-2 rounded-input text-sm font-medium disabled:opacity-50 transition-colors">
            <Save size={14} /> {proposeMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
