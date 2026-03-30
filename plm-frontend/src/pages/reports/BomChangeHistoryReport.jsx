import { useBomChangeHistoryReport } from '../../hooks/useReports';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatVersion, formatDate } from '../../utils/formatters';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function BomChangeHistoryReport() {
  const { data, isLoading } = useBomChangeHistoryReport();
  const [expanded, setExpanded] = useState({});

  if (isLoading) return <LoadingSpinner />;
  const boms = data?.data || [];

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <PageHeader title="BoM Change History" />
      <div className="space-y-3">
        {boms.map(bom => (
          <div key={bom.bom_id} className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
            <button onClick={() => toggle(bom.bom_id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-elevated/30 transition-colors">
              <span className="text-sm font-semibold text-text-primary">BoM #{bom.bom_id} — {bom.product_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{bom.versions?.length} versions</span>
                {expanded[bom.bom_id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </button>
            {expanded[bom.bom_id] && bom.versions?.map((v, i) => (
              <div key={i} className="border-t border-bg-border px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display text-accent-blue text-sm">{formatVersion(v.version)}</span>
                  <StatusBadge status={v.status} />
                  <span className="text-xs text-text-muted">{formatDate(v.created_at)}</span>
                </div>
                {v.components?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-text-muted uppercase font-display mb-1">Components</p>
                    <div className="flex flex-wrap gap-2">
                      {v.components.map((c, j) => (
                        <span key={j} className="bg-bg-elevated px-2 py-1 rounded text-xs text-text-secondary">
                          {c.component_name || `#${c.component_product_id}`} × {c.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {v.operations?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-display mb-1">Operations</p>
                    <div className="flex flex-wrap gap-2">
                      {v.operations.map((o, j) => (
                        <span key={j} className="bg-bg-elevated px-2 py-1 rounded text-xs text-text-secondary">
                          {o.operation_name} ({o.time_minutes}min)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {boms.length === 0 && <div className="bg-bg-surface border border-bg-border rounded-card p-8 text-center text-text-muted">No BoM history</div>}
      </div>
    </div>
  );
}
