export const BASE_URL = 'http://172.16.0.53:8000/api';

export const ENDPOINTS = {
  // Auth
  login:         '/login',
  register:      '/register',
  logout:        '/logout',
  profile:       '/profile',

  // Transactions
  transactions:  '/transactions',
  history:       '/history',
  statusLaundry: '/status-laundry',

  // Reports
  statistics:    '/statistics',
  reportIncome:  '/report-income',
};