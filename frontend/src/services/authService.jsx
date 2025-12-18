import api from './api';

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data; 
};

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
};



export const checkAccess = () =>
  api.get('/protected/hasAccess');

export const testApi = () =>
  api.get('/test');


