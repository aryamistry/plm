import api from './axios';

export const getBoms = (params) => api.get('/boms', { params });
export const getBomById = (id) => api.get(`/boms/${id}`);
export const createBom = (data) => api.post('/boms', data);
export const getBomVersions = (id) => api.get(`/boms/${id}/versions`);
export const getBomVersionDiff = (id, versionId, compareWith) =>
  api.get(`/boms/${id}/versions/${versionId}/diff`, { params: { compareWith } });
