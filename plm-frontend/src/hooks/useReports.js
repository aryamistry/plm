import { useQuery } from '@tanstack/react-query';
import { getEcoReport, getEcoReportDiff, getProductVersionHistory, getBomChangeHistory, getArchivedProducts, getActiveMatrix } from '../api/reports.api';

export const useEcoReport = (params) => useQuery({
  queryKey: ['reports', 'ecos', params],
  queryFn: () => getEcoReport(params).then(r => r.data),
});

export const useEcoReportDiff = (id) => useQuery({
  queryKey: ['reports', 'ecos', id, 'changes'],
  queryFn: () => getEcoReportDiff(id).then(r => r.data),
  enabled: !!id,
});

export const useProductVersionHistoryReport = () => useQuery({
  queryKey: ['reports', 'product-versions'],
  queryFn: () => getProductVersionHistory().then(r => r.data),
});

export const useBomChangeHistoryReport = () => useQuery({
  queryKey: ['reports', 'bom-history'],
  queryFn: () => getBomChangeHistory().then(r => r.data),
});

export const useArchivedProductsReport = () => useQuery({
  queryKey: ['reports', 'archived-products'],
  queryFn: () => getArchivedProducts().then(r => r.data),
});

export const useActiveMatrixReport = () => useQuery({
  queryKey: ['reports', 'active-matrix'],
  queryFn: () => getActiveMatrix().then(r => r.data),
});
