import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { canCreateEco, canAccessSettings, canAccessApprovals } from '../../utils/permissions';
import {
  LayoutDashboard, Package, Layers, FileText, CheckSquare,
  BarChart3, Settings, Users, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useState } from 'react';

const NavItem = ({ to, icon, label, collapsed }) => (
  <NavLink to={to} className={({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-input text-sm transition-all duration-200
     ${isActive
       ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
       : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-transparent'}`
  } title={collapsed ? label : undefined}>
    {icon}
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-bg-surface border-r border-bg-border flex flex-col transition-all duration-300`}>
      <div className={`h-14 flex items-center ${collapsed ? 'justify-center' : 'px-4 justify-between'} border-b border-bg-border`}>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-text-primary font-display tracking-wider">PLM</h1>
            <p className="text-[9px] text-text-muted uppercase tracking-widest font-display">ECO System</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-text-muted hover:text-text-primary transition-colors p-1">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" collapsed={collapsed} />
        <NavItem to="/products" icon={<Package size={15} />} label="Products" collapsed={collapsed} />
        <NavItem to="/boms" icon={<Layers size={15} />} label="Bills of Material" collapsed={collapsed} />
        <NavItem to="/ecos" icon={<FileText size={15} />} label="Change Orders" collapsed={collapsed} />
        {canAccessApprovals(user) && (
          <NavItem to="/approvals" icon={<CheckSquare size={15} />} label="Approvals" collapsed={collapsed} />
        )}
        <NavItem to="/reports" icon={<BarChart3 size={15} />} label="Reports" collapsed={collapsed} />

        {canAccessSettings(user) && (
          <div className="mt-4 pt-4 border-t border-bg-border">
            {!collapsed && <p className="text-[10px] text-text-muted uppercase font-display px-3 mb-1">Admin</p>}
            <NavItem to="/settings/eco-stages" icon={<Settings size={15} />} label="ECO Stages" collapsed={collapsed} />
            <NavItem to="/settings/users" icon={<Users size={15} />} label="User Management" collapsed={collapsed} />
          </div>
        )}
      </nav>

      <div className={`px-3 py-3 border-t border-bg-border ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? (
          <button onClick={handleLogout} title="Logout"
            className="w-7 h-7 bg-accent-red/15 rounded-full flex items-center justify-center text-accent-red text-xs mx-auto hover:bg-accent-red/25 transition-colors">
            <LogOut size={13} />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-text-primary truncate font-medium">{user?.name}</p>
              <p className="text-[10px] text-text-muted font-display uppercase">{user?.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="text-text-muted hover:text-accent-red transition-colors p-1 flex-shrink-0">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
