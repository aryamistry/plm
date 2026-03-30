import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';

import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Dashboard from '../pages/dashboard/Dashboard';
import ProductList from '../pages/products/ProductList';
import ProductDetail from '../pages/products/ProductDetail';
import BomList from '../pages/boms/BomList';
import BomDetail from '../pages/boms/BomDetail';
import BomCreate from '../pages/boms/BomCreate';
import EcoList from '../pages/ecos/EcoList';
import EcoCreate from '../pages/ecos/EcoCreate';
import EcoDetail from '../pages/ecos/EcoDetail';
import EcoProposeChanges from '../pages/ecos/EcoProposeChanges';
import ApprovalQueue from '../pages/approvals/ApprovalQueue';
import ReportsDashboard from '../pages/reports/ReportsDashboard';
import EcoReport from '../pages/reports/EcoReport';
import ProductVersionHistoryReport from '../pages/reports/ProductVersionHistoryReport';
import BomChangeHistoryReport from '../pages/reports/BomChangeHistoryReport';
import ArchivedProductsReport from '../pages/reports/ArchivedProductsReport';
import ActiveMatrixReport from '../pages/reports/ActiveMatrixReport';
import EcoStagesSettings from '../pages/settings/EcoStagesSettings';
import UsersSettings from '../pages/settings/UsersSettings';

const router = createBrowserRouter([
  { path: '/login', element: <AuthLayout><Login /></AuthLayout> },
  { path: '/signup', element: <AuthLayout><Signup /></AuthLayout> },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/products', element: <ProductList /> },
      { path: '/products/:id', element: <ProductDetail /> },
      { path: '/boms', element: <BomList /> },
      { path: '/boms/create', element: <RoleGuard roles={['engineering', 'admin']}><BomCreate /></RoleGuard> },
      { path: '/boms/:id', element: <BomDetail /> },
      { path: '/ecos', element: <EcoList /> },
      { path: '/ecos/create', element: <RoleGuard roles={['engineering', 'admin']}><EcoCreate /></RoleGuard> },
      { path: '/ecos/:id', element: <EcoDetail /> },
      { path: '/ecos/:id/propose', element: <RoleGuard roles={['engineering', 'admin']}><EcoProposeChanges /></RoleGuard> },
      { path: '/approvals', element: <RoleGuard roles={['approver', 'admin']}><ApprovalQueue /></RoleGuard> },
      { path: '/reports', element: <ReportsDashboard /> },
      { path: '/reports/ecos', element: <EcoReport /> },
      { path: '/reports/product-versions', element: <ProductVersionHistoryReport /> },
      { path: '/reports/bom-history', element: <BomChangeHistoryReport /> },
      { path: '/reports/archived-products', element: <ArchivedProductsReport /> },
      { path: '/reports/active-matrix', element: <ActiveMatrixReport /> },
      { path: '/settings/eco-stages', element: <RoleGuard roles={['admin']}><EcoStagesSettings /></RoleGuard> },
      { path: '/settings/users', element: <RoleGuard roles={['admin']}><UsersSettings /></RoleGuard> },
    ],
  },
]);

export default router;
