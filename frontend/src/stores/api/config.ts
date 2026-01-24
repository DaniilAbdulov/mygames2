export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:10000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;
