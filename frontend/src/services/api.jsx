import axios from 'axios';

//fallback : use environment variable or default to relative path to let nginx handle proxying
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL, 
  withCredentials: true,
});

export default api;
