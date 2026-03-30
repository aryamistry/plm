import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../../hooks/useProducts';
import useAuthStore from '../../store/authStore';
import { canCreateEco, canArchiveProduct } from '../../utils/permissions';
import { useArchiveProduct } from '../../hooks/useProducts';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { formatPrice, formatVersion, formatDate, formatDateTime } from '../../utils/formatters';
import { GitPullRequest, Archive } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data, isLoading } = useProduct(id);
  const archiveMutation = useArchiveProduct();
  const [tab, setTab] = useState('versions');
  const [showArchive, setShowArchive] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  const product = data?.data;
  if (!product) return <div className="text-text-muted text-center py-8">Product not found.</div>;

  const activeVersion = product.versions?.find(v => v.status === 'ACTIVE');

  return (
    <div>
      <PageHeader title={product.name} description={`Product #${product.id} • Created ${formatDate(product.created_at)}`}>
        {canCreateEco(user) && activeVersion && (
          <Link to={`/ecos/create?product_id=${product.id}`}
            className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-dim text-white px-3 py-2 rounded-input text-sm font-medium transition-colors">
            <GitPullRequest size={16} /> Raise ECO
          </Link>
        )}
        {canArchiveProduct(user) && activeVersion && (
          <button onClick={() => setShowArchive(true)} className="flex items-center gap-1.5 text-accent-red border border-accent-red/30 px-3 py-2 rounded-input text-sm hover:bg-accent-red/10 transition-colors">
            <Archive size={16} /> Archive
          </button>
        )}
      </PageHeader>

      {/* Active version badge */}
      {activeVersion && (
        <div className="flex items-center gap-3 mb-6">
          <span className="font-display text-lg text-accent-blue">{formatVersion(activeVersion.version)}</span>
          <StatusBadge status={activeVersion.status} />
          <span className="text-sm text-text-secondary">
            Sale: {formatPrice(activeVersion.sale_price)} • Cost: {formatPrice(activeVersion.cost_price)}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-bg-border mb-4">
        {['versions', 'boms'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-muted hover:text-text-primary'
            }`}>{t === 'boms' ? 'Linked BoMs' : 'Version History'}</button>
        ))}
      </div>

      {tab === 'versions' && (
        <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-bg-border">
              {['Version', 'Sale Price', 'Cost Price', 'Attachments', 'Status', 'Created'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {product.versions?.map(v => (
                <tr key={v.id} className={`border-b border-bg-border/30 ${v.status === 'ARCHIVED' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5 font-display text-accent-blue">{formatVersion(v.version)}</td>
                  <td className="px-4 py-2.5 font-display text-sm">{formatPrice(v.sale_price)}</td>
                  <td className="px-4 py-2.5 font-display text-sm">{formatPrice(v.cost_price)}</td>
                  <td className="px-4 py-2.5 text-sm text-text-muted truncate max-w-[150px]">{v.attachments || '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-text-muted">{formatDateTime(v.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'boms' && (
        <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-bg-border">
              {['BoM ID', 'Version', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(product.boms || []).map(b => (
                <tr key={b.id} className="border-b border-bg-border/30">
                  <td className="px-4 py-2.5 font-display text-sm">#{b.id}</td>
                  <td className="px-4 py-2.5 font-display text-accent-blue">{formatVersion(b.version)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-2.5"><Link to={`/boms/${b.id}`} className="text-xs text-accent-blue hover:underline">View</Link></td>
                </tr>
              ))}
              {(!product.boms || product.boms.length === 0) && (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-text-muted text-sm">No BoMs linked to this product</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={showArchive} onClose={() => setShowArchive(false)} onConfirm={() => archiveMutation.mutateAsync(id)}
        title="Archive Product" description="All versions will be set to ARCHIVED." confirmLabel="Archive" variant="danger" />
    </div>
  );
}
