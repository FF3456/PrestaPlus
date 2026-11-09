import { http } from './http.js';

export const auth = {
  register: (body) => http('/auth/register', { method: 'POST', body }),
  verifyOtp: (body) => http('/auth/verify-otp', { method: 'POST', body }),
  resendOtp: (body) => http('/auth/resend-otp', { method: 'POST', body }),
  login: (body) => http('/auth/login', { method: 'POST', body }),
  forgot: (body) => http('/auth/forgot-password', { method: 'POST', body }),
  reset: (body) => http('/auth/reset-password', { method: 'POST', body }),
  me: () => http('/auth/me'),
};

export const users = {
  updateMe: (body) => http('/users/me', { method: 'PUT', body }),
  changePassword: (body) => http('/users/me/password', { method: 'PATCH', body }),
  list: (query) => http('/users', { query }),
  createStaff: (body) => http('/users/staff', { method: 'POST', body }),
  setActive: (id, active) => http(`/users/${id}/active`, { method: 'PATCH', body: { active } }),
};

export const collaterals = {
  preEvaluate: (body) => http('/collaterals/pre-evaluation', { method: 'POST', body }),
  create: (form) => http('/collaterals', { method: 'POST', form }),
  list: (query) => http('/collaterals', { query }),
  get: (id) => http(`/collaterals/${id}`),
  remove: (id) => http(`/collaterals/${id}`, { method: 'DELETE' }),
};

export const requests = {
  create: (body) => http('/loan-requests', { method: 'POST', body }),
  list: (query) => http('/loan-requests', { query }),
  get: (id) => http(`/loan-requests/${id}`),
  appraise: (id, marketValue) => http(`/loan-requests/${id}/appraisal`, { method: 'PATCH', body: { marketValue } }),
  approve: (id, body) => http(`/loan-requests/${id}/approve`, { method: 'PATCH', body }),
  reject: (id, reason) => http(`/loan-requests/${id}/reject`, { method: 'PATCH', body: { reason } }),
};

export const loans = {
  list: (query) => http('/loans', { query }),
  custody: (query) => http('/loans/custody', { query }),
  get: (id) => http(`/loans/${id}`),
  contract: (id) => http(`/loans/${id}/contract`),
  payments: (id) => http(`/loans/${id}/payments`),
  pay: (id, body) => http(`/loans/${id}/payments`, { method: 'POST', body }),
};

export const payments = {
  list: (query) => http('/payments', { query }),
  get: (id) => http(`/payments/${id}`),
};

export const notifications = {
  list: (query) => http('/notifications', { query }),
  unread: () => http('/notifications/unread-count'),
  read: (id) => http(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => http('/notifications/read-all', { method: 'PATCH' }),
};

export const dashboard = {
  staff: () => http('/dashboard/summary'),
  me: () => http('/dashboard/me'),
};
