import api from './axios';

export const getEcos = (params) => api.get('/ecos', { params });
export const getEcoById = (id) => api.get(`/ecos/${id}`);
export const createEco = (data) => api.post('/ecos', data);
export const proposeEcoChanges = (id, data) => api.post(`/ecos/${id}/changes`, data);
export const getEcoDiff = (id) => api.get(`/ecos/${id}/diff`);
export const submitEco = (id) => api.post(`/ecos/${id}/submit`);
export const validateEco = (id) => api.post(`/ecos/${id}/validate`);
export const deleteEco = (id) => api.delete(`/ecos/${id}`);
