import api from './api';

const submitRating = async (canteenId, rating) => {
  const { data } = await api.post('/ratings', { canteenId, rating });
  return data;
};

const getCanteenRatings = async (canteenId) => {
  const { data } = await api.get(`/ratings/${canteenId}`);
  return data;
};

export default {
  submitRating,
  getCanteenRatings
};
