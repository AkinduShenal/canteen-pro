import mongoose from 'mongoose';

export const STAFF_UPDATABLE_STATUSES = ['accepted', 'preparing', 'ready', 'completed', 'cancelled'];

export const NEXT_STATUS_BY_CURRENT = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const normalizeStatus = (status = '') => status.toLowerCase().trim();

export const canAccessOrder = async (order, currentUser) => {
  if (currentUser.role === 'admin') return true;
  if (!currentUser.assignedCanteen) return false;

  return String(order.canteenId) === String(currentUser.assignedCanteen);
};
