import { Check } from 'lucide-react';

export default function EcoStageBar({ stages = [], currentStageId, ecoStatus }) {
  if (!stages.length) return null;

  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);
  const currentIdx = sorted.findIndex(s => s.id === currentStageId);
  const isDone = ecoStatus === 'DONE';
  const isRejected = ecoStatus === 'REJECTED';

  return (
    <div className="flex items-center gap-0 w-full mb-6 bg-bg-surface border border-bg-border rounded-card p-4 overflow-x-auto">
      {sorted.map((stage, i) => {
        const isCompleted = isDone || i < currentIdx;
        const isCurrent = i === currentIdx && !isDone;
        const isPending = i > currentIdx && !isDone;

        return (
          <div key={stage.id} className="flex items-center flex-1 min-w-0">
            {/* Stage circle + label */}
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold transition-all ${
                isCompleted ? 'bg-accent-green text-white' :
                isCurrent && isRejected ? 'bg-accent-red text-white' :
                isCurrent ? 'bg-accent-blue text-white stage-pulse' :
                'bg-bg-elevated text-text-muted border border-bg-border'
              }`}>
                {isCompleted ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-display uppercase tracking-wider text-center truncate max-w-[80px] ${
                isCompleted ? 'text-accent-green' :
                isCurrent ? (isRejected ? 'text-accent-red' : 'text-accent-blue') :
                'text-text-muted'
              }`}>
                {stage.name}
              </span>
              {stage.requires_approval && (
                <span className="text-[8px] text-text-muted font-display">APPROVAL</span>
              )}
            </div>

            {/* Connector line */}
            {i < sorted.length - 1 && (
              <div className={`flex-1 h-[2px] mx-2 ${
                isCompleted ? 'bg-accent-green' : 'bg-bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
