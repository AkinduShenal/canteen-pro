import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true
  },
  message: {
    type: String,
    required: true
  }
  // createdAt is automatically added by timestamps option
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
