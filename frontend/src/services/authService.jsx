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
  api.get('/auth/me');

export const testApi = () =>
  api.get('/test');

// Admin Create User Function
export const createUser = async (userData) => {
  const response = await api.post('/auth/create-user', userData);
  return response.data;
};

// Get All Users (Admin/Manager)
export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

// Delete User (Admin Only)
export const deleteUser = async (id) => {
  const response = await api.delete(`/auth/users/${id}`);
  return response.data;
};

// Update User
export const updateUser = async (id, userData) => {
  const response = await api.put(`/auth/users/${id}`, userData);
  return response.data;
};


