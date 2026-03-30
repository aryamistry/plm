import api from './axios';

export const getEcoReport = (params) => api.get('/reports/ecos', { params });
export const getEcoReportDiff = (id) => api.get(`/reports/ecos/${id}/changes`);
export const getProductVersionHistory = () => api.get('/reports/product-version-history');
export const getBomChangeHistory = () => api.get('/reports/bom-change-history');
export const getArchivedProducts = () => api.get('/reports/archived-products');
export const getActiveMatrix = () => api.get('/reports/active-matrix');
