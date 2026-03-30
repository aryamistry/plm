import { Link } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import { FileText, Package, Layers, Archive, LayoutGrid } from 'lucide-react';

const reports = [
  { path: '/reports/ecos', title: 'ECO Report', description: 'Summary of all Engineering Change Orders with change details', icon: FileText, color: 'border-accent-cyan' },
  { path: '/reports/product-versions', title: 'Product Version History', description: 'Complete version history for all products', icon: Package, color: 'border-accent-blue' },
  { path: '/reports/bom-history', title: 'BoM Change History', description: 'Version-by-version BoM changes with components and operations', icon: Layers, color: 'border-accent-purple' },
  { path: '/reports/archived-products', title: 'Archived Products', description: 'All archived product versions for reference', icon: Archive, color: 'border-accent-red' },
  { path: '/reports/active-matrix', title: 'Active Product–Version–BoM Matrix', description: 'Operational reference view of all active products and BoMs', icon: LayoutGrid, color: 'border-accent-green' },
];

export default function ReportsDashboard() {
  return (
    <div>
      <PageHeader title="Reports" description="Analytics and historical views of your PLM data" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <Link key={r.path} to={r.path}
            className={`bg-bg-surface border border-bg-border rounded-card p-5 hover:bg-bg-elevated transition-colors border-l-2 ${r.color} group`}>
            <r.icon size={20} className="text-text-muted group-hover:text-text-primary transition-colors mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">{r.title}</h3>
            <p className="text-xs text-text-secondary">{r.description}</p>
            <span className="text-xs text-accent-blue mt-3 inline-block group-hover:underline">View Report →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
