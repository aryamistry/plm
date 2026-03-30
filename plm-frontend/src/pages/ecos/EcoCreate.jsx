import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useBoms } from '../../hooks/useBoms';
import { useCreateEco } from '../../hooks/useEcos';
import PageHeader from '../../components/shared/PageHeader';

export default function EcoCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: productsData } = useProducts({ status: 'ACTIVE', limit: 100 });
  const createEco = useCreateEco();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    type: 'PRODUCT',
    product_id: searchParams.get('product_id') || '',
    bom_id: searchParams.get('bom_id') || '',
    effective_date: '',
    version_update: true,
  });

  const products = productsData?.data || [];
  const { data: bomsData } = useBoms({ product_id: form.product_id || undefined, status: 'ACTIVE', limit: 100 });
  const boms = bomsData?.data || [];

  const canProceed = form.title && form.product_id && (form.type === 'PRODUCT' || form.bom_id);

  const handleCreate = async () => {
    const payload = {
      title: form.title,
      type: form.type,
      product_id: Number(form.product_id),
      version_update: form.version_update,
    };
    if (form.type === 'BOM' && form.bom_id) payload.bom_id = Number(form.bom_id);
    if (form.effective_date) payload.effective_date = form.effective_date;

    const res = await createEco.mutateAsync(payload);
    const id = res?.data?.data?.id;
    navigate(id ? `/ecos/${id}` : '/ecos');
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Create ECO" />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm ${step === 1 ? 'bg-accent-blue text-white' : 'bg-bg-elevated text-text-muted'}`}>1</div>
        <div className="flex-1 h-[2px] bg-bg-border" />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm ${step === 2 ? 'bg-accent-blue text-white' : 'bg-bg-elevated text-text-muted'}`}>2</div>
      </div>

      {step === 1 && (
        <div className="bg-bg-surface border border-bg-border rounded-card p-5 space-y-4">
          <h3 className="text-sm font-display text-text-muted uppercase">ECO Details</h3>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Update pricing for Q2"
              className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">ECO Type</label>
            <div className="flex gap-3">
              {['PRODUCT', 'BOM'].map(t => (
                <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-input border cursor-pointer transition-colors ${
                  form.type === t ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-bg-border text-text-secondary hover:bg-bg-elevated'}`}>
                  <input type="radio" name="type" value={t} checked={form.type === t}
                    onChange={(e) => setForm({ ...form, type: e.target.value, bom_id: '' })} className="hidden" />
                  <span className="text-sm font-display">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Product *</label>
            <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value, bom_id: '' })}
              className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
              <option value="">Select product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {form.type === 'BOM' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Bill of Materials *</label>
              <select value={form.bom_id} onChange={(e) => setForm({ ...form, bom_id: e.target.value })}
                className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary">
                <option value="">Select BoM</option>
                {boms.map(b => <option key={b.id} value={b.id}>BoM #{b.id}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase font-display">Effective Date</label>
            <input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
              className="w-full bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
          </div>

          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.version_update} onChange={(e) => setForm({ ...form, version_update: e.target.checked })}
                className="w-4 h-4 rounded border-bg-border bg-bg-elevated accent-accent-blue" />
              <span className="text-sm text-text-primary">Create new version</span>
            </label>
            <span className="text-xs text-text-muted">{form.version_update ? 'A new version will be created upon approval' : 'Changes applied in-place'}</span>
          </div>

          <button onClick={() => setStep(2)} disabled={!canProceed}
            className="bg-accent-blue hover:bg-accent-blue-dim text-white px-6 py-2 rounded-input text-sm font-medium disabled:opacity-50 transition-colors">
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-bg-surface border border-bg-border rounded-card p-5">
          <h3 className="text-sm font-display text-text-muted uppercase mb-4">Review & Submit</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-bg-border/30"><span className="text-text-muted">Title</span><span className="text-text-primary">{form.title}</span></div>
            <div className="flex justify-between py-1 border-b border-bg-border/30"><span className="text-text-muted">Type</span><span className="text-text-primary font-display">{form.type}</span></div>
            <div className="flex justify-between py-1 border-b border-bg-border/30"><span className="text-text-muted">Product</span><span className="text-text-primary">{products.find(p => String(p.id) === String(form.product_id))?.name}</span></div>
            {form.bom_id && <div className="flex justify-between py-1 border-b border-bg-border/30"><span className="text-text-muted">BoM</span><span className="text-text-primary font-display">#{form.bom_id}</span></div>}
            <div className="flex justify-between py-1 border-b border-bg-border/30"><span className="text-text-muted">Version Update</span><span className="text-text-primary">{form.version_update ? 'Yes' : 'No (in-place)'}</span></div>
            {form.effective_date && <div className="flex justify-between py-1"><span className="text-text-muted">Effective Date</span><span className="text-text-primary">{form.effective_date}</span></div>}
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-text-secondary bg-bg-elevated border border-bg-border rounded-input">Back</button>
            <button onClick={handleCreate} disabled={createEco.isPending}
              className="px-6 py-2 text-sm bg-accent-blue text-white rounded-input hover:bg-accent-blue-dim disabled:opacity-50 font-medium transition-colors">
              {createEco.isPending ? 'Creating...' : 'Create ECO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
