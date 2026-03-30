import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEcoStages, createEcoStage, updateEcoStage, deleteEcoStage } from '../../api/eco-stages.api';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, GripVertical } from 'lucide-react';

export default function EcoStagesSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['eco-stages'], queryFn: () => getEcoStages().then(r => r.data) });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', requires_approval: false, sequence: 0 });

  const createMut = useMutation({
    mutationFn: (d) => createEcoStage(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eco-stages'] }); toast.success('Stage created'); setShowAdd(false); setForm({ name: '', requires_approval: false, sequence: 0 }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateEcoStage(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eco-stages'] }); toast.success('Stage updated'); setEditId(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteEcoStage(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eco-stages'] }); toast.success('Stage deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot delete stage with active ECOs'),
  });

  if (isLoading) return <LoadingSpinner />;
  const stages = [...(data?.data || [])].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="max-w-2xl">
      <PageHeader title="ECO Stage Configuration" description="Define the approval workflow pipeline">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
          <Plus size={16} /> Add Stage
        </button>
      </PageHeader>

      <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3 px-4 py-3 border-b border-bg-border/30 group">
            <GripVertical size={14} className="text-text-muted" />
            <span className="w-6 h-6 bg-bg-elevated rounded-full flex items-center justify-center text-xs font-display text-text-muted">{stage.sequence}</span>
            {editId === stage.id ? (
              <>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex-1 bg-bg-elevated border border-bg-border rounded-input px-2 py-1 text-sm text-text-primary" />
                <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={form.requires_approval} onChange={(e) => setForm({ ...form, requires_approval: e.target.checked })}
                    className="accent-accent-blue" />
                  Approval
                </label>
                <button onClick={() => updateMut.mutate({ id: stage.id, data: form })} className="text-accent-green hover:text-accent-green/80"><Save size={14} /></button>
                <button onClick={() => setEditId(null)} className="text-text-muted hover:text-text-primary"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-text-primary">{stage.name}</span>
                {stage.requires_approval && (
                  <span className="text-[10px] text-accent-amber font-display uppercase bg-accent-amber/10 px-2 py-0.5 rounded border border-accent-amber/20">Approval Required</span>
                )}
                <button onClick={() => { setEditId(stage.id); setForm({ name: stage.name, requires_approval: stage.requires_approval, sequence: stage.sequence }); }}
                  className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={14} /></button>
                <button onClick={() => setDeleteId(stage.id)}
                  className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
        {stages.length === 0 && <div className="px-4 py-8 text-center text-text-muted text-sm">No stages configured</div>}
      </div>

      {showAdd && (
        <div className="mt-4 bg-bg-surface border border-bg-border rounded-card p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-3">New Stage</h4>
          <div className="flex items-center gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Stage name"
              className="flex-1 bg-bg-elevated border border-bg-border rounded-input px-3 py-2 text-sm text-text-primary" />
            <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={form.requires_approval} onChange={(e) => setForm({ ...form, requires_approval: e.target.checked })} className="accent-accent-blue" />
              Requires Approval
            </label>
            <button onClick={() => createMut.mutate({ name: form.name, requires_approval: form.requires_approval })} disabled={!form.name}
              className="bg-accent-blue text-white px-4 py-2 rounded-input text-sm disabled:opacity-50">Save</button>
            <button onClick={() => { setShowAdd(false); setForm({ name: '', requires_approval: false, sequence: 0 }); }}
              className="text-text-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutateAsync(deleteId)}
        title="Delete Stage" description="This stage will be removed from the workflow. Cannot delete if ECOs are at this stage."
        confirmLabel="Delete" variant="danger" />
    </div>
  );
}
