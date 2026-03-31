import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { canAccessApprovals } from '../../utils/permissions';
import { useApprovals } from '../../hooks/useApprovals';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/boms': 'Bills of Materials',
  '/ecos': 'Engineering Change Orders',
  '/approvals': 'Approval Queue',
  '/reports': 'Reports',
  '/settings/eco-stages': 'ECO Stage Configuration',
  '/settings/users': 'User Management',
};

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { data: approvalsData } = useApprovals(canAccessApprovals(user));
  const pendingCount = approvalsData?.data?.length || 0;

  const path = location.pathname;
  let title = pageTitles[path] || '';

  if (path.match(/^\/products\/\d+/)) title = 'Product Detail';
  if (path.match(/^\/boms\/\d+/)) title = 'BoM Detail';
  if (path.match(/^\/boms\/create/)) title = 'Create BoM';
  if (path.match(/^\/ecos\/create/)) title = 'Create ECO';
  if (path.match(/^\/ecos\/\d+\/propose/)) title = 'Propose Changes';
  if (path.match(/^\/ecos\/\d+$/) && !path.includes('create')) title = 'ECO Detail';
  if (path.match(/^\/reports\//)) title = 'Reports';

  const crumbs = path.split('/').filter(Boolean);

  return (
    <header className="h-14 bg-bg-surface border-b border-bg-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          {crumbs.map((crumb, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">/</span>}
              <span className="capitalize">{crumb.replace(/-/g, ' ')}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {canAccessApprovals(user) && (
          <div className="relative">
            <Bell size={18} className="text-text-muted" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-amber text-bg-primary text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
