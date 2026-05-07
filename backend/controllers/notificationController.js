const prisma = require("../config/database");

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = { receiverId: req.user.id };
    if (unreadOnly === "true") where.isRead = false;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { receiverId: req.user.id, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        total: totalCount,
      },
      data: notifications.map((n) => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null,
      })),
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, receiverId: req.user.id },
      data: { isRead: true },
    });

    if (result.count === 0)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({ success: false, message: "Error marking as read" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { receiverId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: "All marked as read" });
  } catch (error) {
    console.error("Mark All As Read Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error marking all as read" });
  }
};
