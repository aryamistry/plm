const statusConfig = {
  ACTIVE: { bg: 'bg-accent-green/15', text: 'text-accent-green', border: 'border-accent-green/30' },
  ARCHIVED: { bg: 'bg-accent-red/15', text: 'text-accent-red', border: 'border-accent-red/30' },
  NEW: { bg: 'bg-text-muted/15', text: 'text-text-secondary', border: 'border-text-muted/30' },
  IN_PROGRESS: { bg: 'bg-accent-amber/15', text: 'text-accent-amber', border: 'border-accent-amber/30' },
  DONE: { bg: 'bg-accent-green/15', text: 'text-accent-green', border: 'border-accent-green/30' },
  REJECTED: { bg: 'bg-accent-red/15', text: 'text-accent-red', border: 'border-accent-red/30' },
  PENDING: { bg: 'bg-accent-amber/15', text: 'text-accent-amber', border: 'border-accent-amber/30' },
  APPROVED: { bg: 'bg-accent-green/15', text: 'text-accent-green', border: 'border-accent-green/30' },
  PRODUCT: { bg: 'bg-accent-cyan/15', text: 'text-accent-cyan', border: 'border-accent-cyan/30' },
  BOM: { bg: 'bg-accent-purple/15', text: 'text-accent-purple', border: 'border-accent-purple/30' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.NEW;
  return (
    <span className={`status-badge ${config.bg} ${config.text} ${config.border} ${className}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}
