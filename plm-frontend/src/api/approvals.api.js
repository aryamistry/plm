import api from './axios';

export const getMyApprovals = () => api.get('/approvals');
export const approveEco = (ecoId) => api.post(`/approvals/${ecoId}/approve`);
export const rejectEco = (ecoId) => api.post(`/approvals/${ecoId}/reject`);
