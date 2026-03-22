import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed'],
    default: 'pending',
    required: true
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
