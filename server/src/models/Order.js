import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      name: String,
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  pickupTime: {
    type: String, // e.g., '12:00 - 12:15'
    required: true
  },
  specialNotes: {
    type: String,
    default: ''
  },
  orderToken: {
    type: String, // e.g., 'C2-00045'
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending',
    required: true
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
