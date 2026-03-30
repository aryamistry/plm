import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEco, useEcoDiff, useEcoStages, useSubmitEco, useValidateEco, useDeleteEco } from '../../hooks/useEcos';
import { useApproveEco, useRejectEco } from '../../hooks/useApprovals';
import useAuthStore from '../../store/authStore';
import { canProposeChanges, canSubmitEco, canDeleteEco } from '../../utils/permissions';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EcoStageBar from '../../components/eco/EcoStageBar';
import ProductDiffView from '../../components/eco/ProductDiffView';
import BomDiffView from '../../components/eco/BomDiffView';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import { Send, CheckCircle, X, Trash2, FileEdit, Shield } from 'lucide-react';

export default function EcoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading } = useEco(id);
  const { data: diffData } = useEcoDiff(id);
  const { data: stagesData } = useEcoStages();
  const submitMutation = useSubmitEco();
  const validateMutation = useValidateEco();
  const deleteMutation = useDeleteEco();
  const approveMutation = useApproveEco();
  const rejectMutation = useRejectEco();
  const [showDelete, setShowDelete] = useState(false);
  const [showReject, setShowReject] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  const eco = data?.data;
  if (!eco) return <div className="text-text-muted text-center py-8">ECO not found.</div>;

  const stages = stagesData?.data || [];
  const diff = diffData?.data;
  const hasChanges = diff && ((diff.diff && diff.diff.length > 0) || (diff.component_diff && diff.component_diff.length > 0) || (diff.operation_diff && diff.operation_diff.length > 0));

  const currentStage = stages.find(s => s.id === eco.stage_id);
  const myApproval = eco.approvals?.find(a => a.approver_id === user?.id && a.status === 'PENDING');

  return (
    <div>
      <PageHeader title={eco.title}>
        <div className="flex items-center gap-2 flex-wrap">
          {canProposeChanges(user, eco) && (
            <Link to={`/ecos/${id}/propose`}
              className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
              <FileEdit size={14} /> Propose Changes
            </Link>
          )}
          {canSubmitEco(user, eco) && hasChanges && (
            <button onClick={() => submitMutation.mutate(parseInt(id))}
              disabled={submitMutation.isPending}
              className="flex items-center gap-1.5 bg-accent-green hover:bg-accent-green/80 text-white px-3 py-2 rounded-input text-sm font-medium transition-colors disabled:opacity-50">
              <Send size={14} /> Submit for Review
            </button>
          )}
          {eco.status === 'IN_PROGRESS' && currentStage && !currentStage.requires_approval && ['approver', 'admin'].includes(user?.role) && (
            <button onClick={() => validateMutation.mutate(parseInt(id))}
              disabled={validateMutation.isPending}
              className="flex items-center gap-1.5 bg-accent-amber hover:bg-accent-amber/80 text-bg-primary px-3 py-2 rounded-input text-sm font-medium transition-colors disabled:opacity-50">
              <Shield size={14} /> Validate
            </button>
          )}
          {myApproval && (
            <>
              <button onClick={() => approveMutation.mutate(parseInt(id))}
                disabled={approveMutation.isPending}
                className="flex items-center gap-1.5 bg-accent-green hover:bg-accent-green/80 text-white px-3 py-2 rounded-input text-sm font-medium transition-colors disabled:opacity-50">
                <CheckCircle size={14} /> Approve
              </button>
              <button onClick={() => setShowReject(true)}
                className="flex items-center gap-1.5 bg-accent-red hover:bg-accent-red/80 text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
                <X size={14} /> Reject
              </button>
            </>
          )}
          {canDeleteEco(user, eco) && (
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 text-accent-red border border-accent-red/30 px-3 py-2 rounded-input text-sm hover:bg-accent-red/10 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </PageHeader>

      {/* Stage Bar */}
      <EcoStageBar stages={stages} currentStageId={eco.stage_id} ecoStatus={eco.status} />

      {/* ECO Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Type', value: <StatusBadge status={eco.type} /> },
          { label: 'Status', value: <StatusBadge status={eco.status} /> },
          { label: 'Product', value: <Link to={`/products/${eco.product_id}`} className="text-accent-blue hover:underline">{eco.product_name}</Link> },
          { label: 'Version Update', value: eco.version_update ? 'New version' : 'In-place' },
          { label: 'Effective Date', value: formatDate(eco.effective_date) },
          { label: 'Created By', value: eco.created_by_name || `User #${eco.created_by}` },
          { label: 'Created', value: formatDate(eco.created_at) },
          { label: 'Stage', value: <span className="font-display">{eco.stage_name || currentStage?.name}</span> },
        ].map((item, i) => (
          <div key={i} className="bg-bg-surface border border-bg-border rounded-card p-3">
            <p className="text-[10px] text-text-muted uppercase font-display mb-1">{item.label}</p>
            <div className="text-sm text-text-primary">{item.value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Proposed Changes */}
      <div className="mb-6">
        <h3 className="text-sm font-display text-text-muted uppercase mb-3">Proposed Changes</h3>
        {!hasChanges ? (
          <div className="bg-bg-surface border border-bg-border rounded-card p-8 text-center">
            <p className="text-text-muted text-sm">No changes proposed yet.</p>
            {canProposeChanges(user, eco) && (
              <Link to={`/ecos/${id}/propose`} className="text-accent-blue hover:underline text-sm mt-2 inline-block">Propose Changes →</Link>
            )}
          </div>
        ) : (
          <div className="bg-bg-surface border border-bg-border rounded-card p-4">
            {eco.type === 'PRODUCT' && diff?.diff && <ProductDiffView diff={diff.diff} />}
            {eco.type === 'BOM' && <BomDiffView componentDiff={diff?.component_diff || []} operationDiff={diff?.operation_diff || []} />}
          </div>
        )}
      </div>

      {/* Approvals */}
      {eco.approvals && eco.approvals.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-display text-text-muted uppercase mb-3">Approvals</h3>
          <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                {['Approver', 'Status', 'Action Time'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {eco.approvals.map((a, i) => (
                  <tr key={i} className="border-b border-bg-border/30">
                    <td className="px-4 py-2.5 text-sm text-text-primary">{a.approver_name || `User #${a.approver_id}`}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">{formatDate(a.actioned_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={async () => { await deleteMutation.mutateAsync(parseInt(id)); navigate('/ecos'); }}
        title="Delete ECO" description="This ECO and all proposed changes will be permanently deleted."
        confirmLabel="Delete" variant="danger" />

      <ConfirmDialog open={showReject} onClose={() => setShowReject(false)}
        onConfirm={() => rejectMutation.mutateAsync(parseInt(id))}
        title="Reject ECO" description="This ECO will be rejected and returned. This action cannot be undone."
        confirmLabel="Reject" variant="danger" />
    </div>
  );
}
