// src/services/api.js
import axios from 'axios';

//const API_BASE_URL = 'https://accounting-backend-uevd.onrender.com/api';
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const salesInvoiceAPI = {
  getAll: () => api.get('/sales-invoices', { params: { _t: Date.now() } }),
  getById: (id) => api.get(`/sales-invoices/${id}`),
  create: (data) => api.post('/sales-invoices', data),
  update: (id, data) => api.patch(`/sales-invoices/${id}`, data),
  delete: (id) => api.delete(`/sales-invoices/${id}`),
};

export const contactAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  getById: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.patch(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

export const itemAPI = {
  getAll: () => api.get('/items'),
  getById: (id) => api.get(`/items/${id}`),
  getSaleDetails: (id) => api.get(`/items/${id}/sale-details`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.patch(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const chartOfAccountsAPI = {
  getAll: () => api.get('/chart-of-accounts'),
  getById: (id) => api.get(`/chart-of-accounts/${id}`),
  create: (data) => api.post('/chart-of-accounts', data),
  update: (id, data) => api.patch(`/chart-of-accounts/${id}`, data),
  delete: (id) => api.delete(`/chart-of-accounts/${id}`),
  importDefaults: () => api.post('/chart-of-accounts/import-defaults'),
};

export const bankAccountAPI = {
  getAll: () => api.get('/bank-accounts'),
  getById: (id) => api.get(`/bank-accounts/${id}`),
  create: (data) => api.post('/bank-accounts', data),
  update: (id, data) => api.patch(`/bank-accounts/${id}`, data),
  delete: (id) => api.delete(`/bank-accounts/${id}`),
};

export const bankTransactionAPI = {
  getAll: () => api.get('/bank-transactions'),
  create: (data) => api.post('/bank-transactions', data),
};

export const accountTypeAPI = {
  getAll: () => api.get('/account-types'),
  getById: (id) => api.get(`/account-types/${id}`),
  create: (data) => api.post('/account-types', data),
  update: (id, data) => api.patch(`/account-types/${id}`, data),
  delete: (id) => api.delete(`/account-types/${id}`),
};

export const bankAccountTypeAPI = {
  getAll: () => api.get('/bank-account-types'),
  getById: (id) => api.get(`/bank-account-types/${id}`),
  create: (data) => api.post('/bank-account-types', data),
  update: (id, data) => api.patch(`/bank-account-types/${id}`, data),
  delete: (id) => api.delete(`/bank-account-types/${id}`),
};

export const taxTypeAPI = {
  getAll: () => api.get('/tax-types'),
  getById: (id) => api.get(`/tax-types/${id}`),
  create: (data) => api.post('/tax-types', data),
  update: (id, data) => api.patch(`/tax-types/${id}`, data),
  delete: (id) => api.delete(`/tax-types/${id}`),
};

export const quotationAPI = {
  getAll: () => api.get('/quotations'),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.patch(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
};

export const billAPI = {
  getAll: () => api.get('/bills'),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.patch(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
};

export const purchaseOrderAPI = {
  getAll: () => api.get('/purchase-orders'),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.patch(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
};

// Reports API
export const reportsAPI = {
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  salesSummary: (params) => api.get('/reports/sales-summary', { params }),
  purchaseSummary: (params) => api.get('/reports/purchase-summary', { params }),
  salesByCustomer: (params) => api.get('/reports/sales-by-customer', { params }),
  purchaseByVendor: (params) => api.get('/reports/purchase-by-vendor', { params }),
  customerBalance: () => api.get('/reports/customer-balance'),
  vendorBalance: () => api.get('/reports/vendor-balance'),
  agedReceivables: () => api.get('/reports/aged-receivables'),
  agedPayables: () => api.get('/reports/aged-payables'),
  invoiceDetails: (params) => api.get('/reports/invoice-details', { params }),
  billDetails: (params) => api.get('/reports/bill-details', { params }),
  contactList: (params) => api.get('/contacts', { params }),
};

export default api;