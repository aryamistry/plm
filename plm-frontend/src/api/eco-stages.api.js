import api from './axios';

export const getEcoStages = () => api.get('/eco-stages');
export const createEcoStage = (data) => api.post('/eco-stages', data);
export const updateEcoStage = (id, data) => api.patch(`/eco-stages/${id}`, data);
export const deleteEcoStage = (id) => api.delete(`/eco-stages/${id}`);
