import mongoose from 'mongoose';

const announcementSchema = mongoose.Schema(
  {
    canteenId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Canteen',
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
