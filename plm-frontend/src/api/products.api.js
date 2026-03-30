import api from './axios';

export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const archiveProduct = (id) => api.patch(`/products/${id}/archive`);
export const getProductVersions = (id) => api.get(`/products/${id}/versions`);
