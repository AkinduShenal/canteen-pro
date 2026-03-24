import mongoose from 'mongoose';

const canteenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  openTime: {
    type: String,
    required: true
  },
  closeTime: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Canteen = mongoose.model('Canteen', canteenSchema);
export default Canteen;
