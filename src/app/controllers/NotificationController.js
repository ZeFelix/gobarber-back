import User from '../models/User';
import Notification from '../schemas/Notifications';

class NotificationController {
  async index(req, res) {
    const checkProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkProvider) {
      return res.status(401).json({ message: 'You can only create appointments with providers' });
    }

    const notifications = await Notification.find({
      user: req.userId,
    }).sort({ createdAt: 'desc' }).limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    ).then((notification) => {
      return res.json(notification);
    }).catch((error) => {
      return res.status(400).json(error);
    });
  }
}

export default new NotificationController();
