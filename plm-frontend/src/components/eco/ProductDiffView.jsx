import { formatPrice } from '../../utils/formatters';

export default function ProductDiffView({ diff = [] }) {
  if (!diff.length) return <p className="text-text-muted text-sm py-4">No changes to display.</p>;

  return (
    <div className="border border-bg-border rounded-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bg-border bg-bg-elevated/50">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">Field</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">Current Value</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">Proposed Value</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">Change</th>
          </tr>
        </thead>
        <tbody>
          {diff.map((item, i) => {
            const changed = String(item.old_value) !== String(item.new_value);
            const isPrice = item.field.includes('price');
            const oldVal = isPrice ? formatPrice(item.old_value) : (item.old_value ?? '—');
            const newVal = isPrice ? formatPrice(item.new_value) : (item.new_value ?? '—');
            return (
              <tr key={i} className={`border-b border-bg-border/30 ${changed ? 'border-l-2 border-l-accent-amber' : ''}`}>
                <td className="px-4 py-3 text-sm font-display text-text-primary capitalize">{item.field.replace(/_/g, ' ')}</td>
                <td className={`px-4 py-3 text-sm font-display ${changed ? 'text-accent-red' : 'text-text-muted'}`}>{oldVal}</td>
                <td className={`px-4 py-3 text-sm font-display ${changed ? 'text-accent-green' : 'text-text-muted'}`}>{newVal}</td>
                <td className="px-4 py-3 text-sm">
                  {changed ? <span className="text-accent-amber text-xs font-display">MODIFIED</span> : <span className="text-text-muted text-xs">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
