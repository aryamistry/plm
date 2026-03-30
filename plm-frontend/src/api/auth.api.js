import api from './axios';

export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);
export const refreshToken = (data) => api.post('/auth/refresh', data);
export const logout = (data) => api.post('/auth/logout', data);
