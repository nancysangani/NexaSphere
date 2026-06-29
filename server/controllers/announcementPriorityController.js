import { announcementPriorityService } from "../services/announcementPriorityService.js";

export const getAnnouncements = async (req, res) => {
  try {
    const announcements =
      announcementPriorityService.getAnnouncements();

    return res.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const announcement =
      announcementPriorityService.createAnnouncement(req.body);

    return res.status(201).json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create announcement",
    });
  }
};

export const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const announcement =
      announcementPriorityService.updatePriority(
        id,
        priority
      );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update priority",
    });
  }
};

export const pinAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned } = req.body;

    const announcement =
      announcementPriorityService.pinAnnouncement(
        id,
        pinned
      );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to pin announcement",
    });
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const announcement =
      announcementPriorityService.markAnnouncementRead(
        id,
        userId
      );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark announcement as read",
    });
  }
};

export const analytics = async (req, res) => {
  try {
    const data =
      announcementPriorityService.getAnalytics();

    return res.json({
      success: true,
      analytics: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};