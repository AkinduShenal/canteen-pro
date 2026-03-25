import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    dailyQuantity: {
      type: Number,
      default: null,
      min: 0,
    },
    canteen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ canteen: 1, category: 1, name: 1 }, { unique: true });
menuItemSchema.index({ canteen: 1, category: 1, available: 1, isSpecial: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
