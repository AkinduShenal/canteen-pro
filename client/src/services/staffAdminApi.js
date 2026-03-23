import api from './api.js';

export const staffAdminApi = {
  getDashboardMetrics: () => api.get('/staff-admin/dashboard/metrics'),

  getAnnouncements: () => api.get('/announcements'),
  getCanteenAnnouncements: (canteenId) => api.get(`/announcements/canteen/${canteenId}`),

  getOrders: (params = {}) => api.get('/staff-admin/orders', { params }),
  getPriorityOrders: () => api.get('/staff-admin/orders', { params: { priorityOnly: 'true' } }),
  updateOrderStatus: (orderId, payload) =>
    api.patch(`/staff-admin/orders/${orderId}/status`, payload),
  bulkMarkReady: (orderIds) => api.patch('/staff-admin/orders/bulk/ready', { orderIds }),

  getFeedback: () => api.get('/staff-admin/feedback'),
  removeFeedback: (orderId) => api.delete(`/staff-admin/feedback/${orderId}`),

  getStaffAccounts: () => api.get('/staff-admin/staff'),
  createStaffAccount: (payload) => api.post('/staff-admin/staff', payload),
  updateStaffAccount: (staffId, payload) => api.put(`/staff-admin/staff/${staffId}`, payload),
  deleteStaffAccount: (staffId) => api.delete(`/staff-admin/staff/${staffId}`),

  getCanteenStaffMembers: () => api.get('/staff-admin/canteen-staff'),
  createCanteenStaffMember: (payload) => api.post('/staff-admin/canteen-staff', payload),
  updateCanteenStaffMember: (staffId, payload) => api.put(`/staff-admin/canteen-staff/${staffId}`, payload),
  deleteCanteenStaffMember: (staffId) => api.delete(`/staff-admin/canteen-staff/${staffId}`),

  getCanteenOptions: () => api.get('/staff-admin/canteens/options'),
  getBasicReports: () => api.get('/staff-admin/reports/basic'),

  getAllCanteens: () => api.get('/canteens'),
  createCanteen: (payload) => api.post('/canteens', payload),
  updateCanteen: (canteenId, payload) => api.put(`/canteens/${canteenId}`, payload),
  deleteCanteen: (canteenId) => api.delete(`/canteens/${canteenId}`),
};
