import { Link } from 'react-router-dom';
import { Package, Layers, GitPullRequest, CheckCircle, Clock } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { useBoms } from '../../hooks/useBoms';
import { useEcos } from '../../hooks/useEcos';
import { useApprovals } from '../../hooks/useApprovals';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import { canAccessApprovals, canCreateEco } from '../../utils/permissions';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: productsData, isLoading: loadingProducts } = useProducts({ status: 'ACTIVE', limit: 100 });
  const { data: bomsData, isLoading: loadingBoms } = useBoms({ status: 'ACTIVE', limit: 100 });
  const { data: ecosData, isLoading: loadingEcos } = useEcos({ limit: 10 });
  const { data: approvalsData } = useApprovals(canAccessApprovals(user));

  const stats = [
    { label: 'Active Products', value: productsData?.pagination?.total || 0, icon: Package, color: 'border-accent-cyan', loading: loadingProducts },
    { label: 'Active BoMs', value: bomsData?.pagination?.total || 0, icon: Layers, color: 'border-accent-purple', loading: loadingBoms },
  ];

  if (canCreateEco(user)) {
    stats.push({ label: 'Open ECOs', value: ecosData?.pagination?.total || 0, icon: GitPullRequest, color: 'border-accent-amber', loading: loadingEcos });
  }
  if (canAccessApprovals(user)) {
    stats.push({ label: 'Pending Approvals', value: approvalsData?.data?.length || 0, icon: CheckCircle, color: 'border-accent-red' });
  }

  const recentEcos = ecosData?.data || [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h2>
      <p className="text-sm text-text-secondary mb-6">Welcome back, {user?.name}</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-bg-surface border border-bg-border rounded-card p-4 border-l-2 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <stat.icon size={18} className="text-text-muted" />
              {stat.loading && <div className="w-3 h-3 border border-text-muted border-t-accent-blue rounded-full animate-spin" />}
            </div>
            <p className="text-3xl font-bold font-display text-text-primary mt-3">{stat.value}</p>
            <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent ECOs */}
      <div className="bg-bg-surface border border-bg-border rounded-card">
        <div className="px-4 py-3 border-b border-bg-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Clock size={14} /> Recent ECOs
          </h3>
          <Link to="/ecos" className="text-xs text-accent-blue hover:underline">View All</Link>
        </div>
        {loadingEcos ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border">
                  {['Title', 'Type', 'Product', 'Stage', 'Status', 'Created'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase font-display">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentEcos.map((eco) => (
                  <tr key={eco.id} className="border-b border-bg-border/30 table-row-hover">
                    <td className="px-4 py-2.5 text-sm">
                      <Link to={`/ecos/${eco.id}`} className="text-accent-blue hover:underline">{eco.title}</Link>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={eco.type} /></td>
                    <td className="px-4 py-2.5 text-sm text-text-secondary">{eco.product_name}</td>
                    <td className="px-4 py-2.5 text-xs text-text-muted font-display">{eco.stage_name}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={eco.status} /></td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">{formatDate(eco.created_at)}</td>
                  </tr>
                ))}
                {recentEcos.length === 0 && (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted text-sm">No ECOs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
