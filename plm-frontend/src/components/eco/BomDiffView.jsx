import StatusBadge from '../shared/StatusBadge';

export default function BomDiffView({ componentDiff = [], operationDiff = [] }) {
  return (
    <div className="space-y-4">
      {/* Component Changes */}
      <div>
        <h4 className="text-sm font-display text-text-muted uppercase mb-2">Component Changes</h4>
        {componentDiff.length === 0 ? (
          <p className="text-text-muted text-sm">No component changes.</p>
        ) : (
          <div className="border border-bg-border rounded-card overflow-hidden">
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
                {componentDiff.map((item, i) => {
                  const rowStyle = item.change === 'ADDED' ? 'border-l-2 border-l-accent-green' :
                    item.change === 'REMOVED' ? 'border-l-2 border-l-accent-red' :
                    item.change === 'REDUCED' ? 'border-l-2 border-l-accent-amber' : '';
                  return (
                    <tr key={i} className={`border-b border-bg-border/30 ${rowStyle}`}>
                      <td className="px-4 py-2.5 text-sm text-text-primary">
                        {item.component_name || `Product #${item.component_product_id}`}
                        {item.change === 'REMOVED' && <span className="line-through ml-1 text-text-muted">(removed)</span>}
                      </td>
                      <td className={`px-4 py-2.5 text-sm font-display ${item.change !== 'UNCHANGED' ? 'text-accent-red' : 'text-text-muted'}`}>
                        {item.old_quantity ?? '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-sm font-display ${item.change !== 'UNCHANGED' ? 'text-accent-green' : 'text-text-muted'}`}>
                        {item.new_quantity ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={item.change === 'REDUCED' ? 'IN_PROGRESS' : item.change === 'ADDED' ? 'ACTIVE' : item.change === 'REMOVED' ? 'REJECTED' : 'NEW'} />
                        <span className="ml-1 text-xs text-text-muted font-display">{item.change}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operation Changes */}
      <div>
        <h4 className="text-sm font-display text-text-muted uppercase mb-2">Operation Changes</h4>
        {operationDiff.length === 0 ? (
          <p className="text-text-muted text-sm">No operation changes.</p>
        ) : (
          <div className="border border-bg-border rounded-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border bg-bg-elevated/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Operation</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Current Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">New Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase font-display">Δ</th>
                </tr>
              </thead>
              <tbody>
                {operationDiff.map((item, i) => {
                  const delta = (item.new_time || 0) - (item.old_time || 0);
                  const changed = item.old_time !== item.new_time;
                  return (
                    <tr key={i} className={`border-b border-bg-border/30 ${changed ? 'border-l-2 border-l-accent-amber' : ''}`}>
                      <td className="px-4 py-2.5 text-sm text-text-primary">{item.operation_name}</td>
                      <td className="px-4 py-2.5 text-sm font-display text-text-muted">{item.old_time ?? item.old_time_minutes ?? '—'} min</td>
                      <td className="px-4 py-2.5 text-sm font-display text-text-muted">{item.new_time ?? item.new_time_minutes ?? '—'} min</td>
                      <td className="px-4 py-2.5 text-sm font-display">
                        {changed ? (
                          <span className={delta > 0 ? 'text-accent-red' : 'text-accent-green'}>
                            {delta > 0 ? '+' : ''}{delta} min
                          </span>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
