import { useProductVersionHistoryReport } from '../../hooks/useReports';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatPrice, formatVersion, formatDate } from '../../utils/formatters';

export default function ProductVersionHistoryReport() {
  const { data, isLoading } = useProductVersionHistoryReport();
  if (isLoading) return <LoadingSpinner />;

  const rows = data?.data || [];
  const grouped = rows.reduce((acc, r) => {
    const key = `${r.id}-${r.name}`;
    if (!acc[key]) acc[key] = { id: r.id, name: r.name, versions: [] };
    acc[key].versions.push(r);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Product Version History" />
      <div className="space-y-4">
        {Object.values(grouped).map(product => (
          <div key={product.id} className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border bg-bg-elevated/30">
              <span className="text-sm font-semibold text-text-primary">{product.name}</span>
              <span className="text-xs text-text-muted ml-2">({product.versions.length} versions)</span>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-bg-border">
                {['Version', 'Sale Price', 'Cost Price', 'Status', 'Created'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {product.versions.map((v, i) => (
                  <tr key={i} className={`border-b border-bg-border/30 ${v.status === 'ARCHIVED' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2 font-display text-accent-blue">{formatVersion(v.version)}</td>
                    <td className="px-4 py-2 font-display text-sm">{formatPrice(v.sale_price)}</td>
                    <td className="px-4 py-2 font-display text-sm">{formatPrice(v.cost_price)}</td>
                    <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-2 text-xs text-text-muted">{formatDate(v.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="bg-bg-surface border border-bg-border rounded-card p-8 text-center text-text-muted">No version history</div>
        )}
      </div>
    </div>
  );
}
