import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'default' }) {
  const [loading, setLoading] = useState(false);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, handleEscape]);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); }
    finally { setLoading(false); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-bg-surface border border-bg-border rounded-card p-6 w-full max-w-md shadow-xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-text-muted hover:text-text-primary">
          <X size={18} />
        </button>
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="mt-0.5 p-2 bg-accent-red/15 rounded-full">
              <AlertTriangle size={18} className="text-accent-red" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary bg-bg-elevated border border-bg-border rounded-input hover:bg-bg-border transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-input font-medium transition-colors ${
              variant === 'danger'
                ? 'bg-accent-red text-white hover:bg-accent-red/80'
                : 'bg-accent-blue text-white hover:bg-accent-blue-dim'
            } disabled:opacity-50`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
