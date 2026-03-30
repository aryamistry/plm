import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, GitPullRequest, CheckCircle, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { canAccessApprovals, canAccessSettings } from '../../utils/permissions';
import { useApprovals } from '../../hooks/useApprovals';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/boms', icon: Layers, label: 'Bills of Materials' },
  { path: '/ecos', icon: GitPullRequest, label: 'Change Orders' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data: approvalsData } = useApprovals();
  const pendingCount = approvalsData?.data?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-input text-sm transition-colors ${
      isActive
        ? 'bg-bg-elevated text-accent-blue border-l-2 border-accent-blue -ml-[2px]'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
    }`;

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-bg-surface border-r border-bg-border flex flex-col transition-all duration-200`}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-bg-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent-blue rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">P</span>
            </div>
            <span className="text-text-primary font-display font-bold text-lg">PLM</span>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto text-text-muted hover:text-text-primary p-1">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} className={linkClass} title={collapsed ? label : undefined}>
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {canAccessApprovals(user) && (
          <NavLink to="/approvals" className={linkClass} title={collapsed ? 'Approvals' : undefined}>
            <div className="relative">
              <CheckCircle size={18} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent-red text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            {!collapsed && <span>Approvals</span>}
            {!collapsed && pendingCount > 0 && (
              <span className="ml-auto bg-accent-red/20 text-accent-red text-xs px-1.5 py-0.5 rounded font-display">{pendingCount}</span>
            )}
          </NavLink>
        )}

        <NavLink to="/reports" className={linkClass} title={collapsed ? 'Reports' : undefined}>
          <BarChart2 size={18} />
          {!collapsed && <span>Reports</span>}
        </NavLink>

        {canAccessSettings(user) && (
          <NavLink to="/settings/eco-stages" className={linkClass} title={collapsed ? 'Settings' : undefined}>
            <Settings size={18} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-bg-border">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-accent-blue/20 text-accent-blue rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted font-display uppercase">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="text-text-muted hover:text-accent-red p-1" title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
