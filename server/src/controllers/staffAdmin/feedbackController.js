import Order from '../../models/Order.js';
import { isValidObjectId } from './shared.js';

export const addFeedbackToCompletedOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment = '' } = req.body;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only review your own order' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback is allowed only for completed orders' });
    }

    if (order.feedback) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this order' });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    order.feedback = {
      rating: parsedRating,
      comment: comment.trim(),
      submittedBy: req.user._id,
      isHidden: false,
    };

    await order.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: order.feedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackList = async (req, res) => {
  try {
    const filter = { feedback: { $ne: null } };

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      filter.canteenId = req.user.assignedCanteen;
    }

    const orders = await Order.find(filter)
      .populate('canteenId', 'name')
      .populate('userId', 'name email')
      .sort({ 'feedback.createdAt': -1, createdAt: -1 });

    const feedbackList = orders.map((order) => ({
      orderId: order._id,
      canteen: order.canteenId,
      student: order.userId,
      status: order.status,
      pickupTime: order.pickupTime,
      token: order.token,
      feedback: order.feedback,
    }));

    res.json(feedbackList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const moderateFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order || !order.feedback) {
      return res.status(404).json({ message: 'Feedback not found for this order' });
    }

    order.feedback.isHidden = true;
    order.feedback.moderatedBy = req.user._id;
    order.feedback.moderatedAt = new Date();

    await order.save();

    res.json({ message: 'Feedback removed from public view' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
