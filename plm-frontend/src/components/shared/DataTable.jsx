import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

export default function DataTable({ columns, data, isLoading, pagination, onPageChange }) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-bg-border">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase font-display">
                {col.header}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-bg-border/50">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 w-24 rounded" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-surface border border-bg-border rounded-card">
        <EmptyState message="No records found" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-bg-border rounded-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-border">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase font-display whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i} className="border-b border-bg-border/30 table-row-hover transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-bg-border">
          <span className="text-xs text-text-muted">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded hover:bg-bg-elevated"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded hover:bg-bg-elevated"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
