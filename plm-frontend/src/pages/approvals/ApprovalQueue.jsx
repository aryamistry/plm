import { Link } from 'react-router-dom';
import { useApprovals, useApproveEco, useRejectEco } from '../../hooks/useApprovals';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import { useState } from 'react';

export default function ApprovalQueue() {
  const { data, isLoading } = useApprovals();
  const approveMutation = useApproveEco();
  const rejectMutation = useRejectEco();
  const [rejectId, setRejectId] = useState(null);

  if (isLoading) return <LoadingSpinner />;

  const approvals = data?.data || [];

  return (
    <div>
      <PageHeader title="Pending Approvals" description={`${approvals.length} items awaiting your review`} />

      {approvals.length === 0 ? (
        <div className="bg-bg-surface border border-bg-border rounded-card p-12 text-center">
          <p className="text-text-muted">No pending approvals</p>
        </div>
      ) : (
        <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bg-border">
                {['ECO Title', 'Type', 'Product', 'Stage', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.eco_id || a.id} className="border-b border-bg-border/30 table-row-hover transition-all">
                  <td className="px-4 py-3">
                    <Link to={`/ecos/${a.eco_id}`} className="text-accent-blue hover:underline text-sm font-medium">{a.eco_title || a.title || `ECO #${a.eco_id}`}</Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.eco_type || a.type} /></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{a.product_name}</td>
                  <td className="px-4 py-3 text-xs font-display text-text-muted">{a.stage_name}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => approveMutation.mutate(a.eco_id)}
                        disabled={approveMutation.isPending}
                        className="bg-accent-green/15 text-accent-green border border-accent-green/30 px-3 py-1.5 rounded-input text-xs font-medium hover:bg-accent-green/25 transition-colors disabled:opacity-50">
                        Approve
                      </button>
                      <button onClick={() => setRejectId(a.eco_id)}
                        className="bg-accent-red/15 text-accent-red border border-accent-red/30 px-3 py-1.5 rounded-input text-xs font-medium hover:bg-accent-red/25 transition-colors">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!rejectId} onClose={() => setRejectId(null)}
        onConfirm={() => rejectMutation.mutateAsync(rejectId)}
        title="Reject ECO" description="This ECO will be rejected. This action cannot be undone."
        confirmLabel="Reject" variant="danger" />
    </div>
  );
}
