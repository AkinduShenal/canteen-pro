import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false, timestamps: true }
);

const orderSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: {
    type: [orderItemSchema],
    default: [],
  },
  pickupTime: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  token: {
    type: String,
    trim: true,
    default: '',
  },
  totalAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending',
    required: true
  },
  statusHistory: {
    type: [
      {
        status: {
          type: String,
          enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          trim: true,
          maxlength: 300,
          default: '',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
  feedback: {
    type: feedbackSchema,
    default: null,
  }
}, { timestamps: true });

orderSchema.index({ canteenId: 1, pickupTime: 1 });
orderSchema.index({ status: 1, pickupTime: 1 });
orderSchema.index({ token: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ canteenId: 1, createdAt: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
