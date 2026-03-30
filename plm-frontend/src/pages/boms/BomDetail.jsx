import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBom } from '../../hooks/useBoms';
import useAuthStore from '../../store/authStore';
import { canCreateEco } from '../../utils/permissions';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatVersion, formatDate } from '../../utils/formatters';
import { GitPullRequest } from 'lucide-react';

export default function BomDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data, isLoading } = useBom(id);
  const [tab, setTab] = useState('current');

  if (isLoading) return <LoadingSpinner />;
  const bom = data?.data;
  if (!bom) return <div className="text-text-muted text-center py-8">BoM not found.</div>;

  const active = bom.active_version;

  return (
    <div>
      <PageHeader title={`BoM #${bom.id} — ${bom.product_name || 'Product'}`}>
        {canCreateEco(user) && active && (
          <Link to={`/ecos/create?product_id=${bom.product_id}&bom_id=${bom.id}`}
            className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
            <GitPullRequest size={16} /> Raise ECO
          </Link>
        )}
      </PageHeader>

      {active && (
        <div className="flex items-center gap-3 mb-6">
          <span className="font-display text-lg text-accent-blue">{formatVersion(active.version)}</span>
          <StatusBadge status={active.status} />
        </div>
      )}

      <div className="flex gap-0 border-b border-bg-border mb-4">
        {['current', 'versions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>
            {t === 'current' ? 'Current Version' : 'Version History'}
          </button>
        ))}
      </div>

      {tab === 'current' && active && (
        <div className="space-y-6">
          {/* Components */}
          <div>
            <h4 className="text-sm font-display text-text-muted uppercase mb-2">Components ({active.components?.length || 0})</h4>
            <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-bg-border">
                  {['Component', 'Quantity'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(active.components || []).map((c, i) => (
                    <tr key={i} className="border-b border-bg-border/30">
                      <td className="px-4 py-2.5 text-sm text-text-primary">{c.component_name || `Product #${c.component_product_id}`}</td>
                      <td className="px-4 py-2.5 font-display text-sm">{c.quantity}</td>
                    </tr>
                  ))}
                  {(!active.components || active.components.length === 0) && (
                    <tr><td colSpan="2" className="px-4 py-6 text-center text-text-muted text-sm">No components</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Operations */}
          <div>
            <h4 className="text-sm font-display text-text-muted uppercase mb-2">Operations ({active.operations?.length || 0})</h4>
            <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-bg-border">
                  {['Operation', 'Time (mins)', 'Work Center'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(active.operations || []).map((o, i) => (
                    <tr key={i} className="border-b border-bg-border/30">
                      <td className="px-4 py-2.5 text-sm text-text-primary">{o.operation_name}</td>
                      <td className="px-4 py-2.5 font-display text-sm">{o.time_minutes}</td>
                      <td className="px-4 py-2.5 text-sm text-text-muted">{o.work_center}</td>
                    </tr>
                  ))}
                  {(!active.operations || active.operations.length === 0) && (
                    <tr><td colSpan="3" className="px-4 py-6 text-center text-text-muted text-sm">No operations</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-bg-border">
              {['Version', 'Status', 'Created'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(bom.versions || []).map(v => (
                <tr key={v.id} className={`border-b border-bg-border/30 ${v.status === 'ARCHIVED' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5 font-display text-accent-blue">{formatVersion(v.version)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-text-muted">{formatDate(v.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
