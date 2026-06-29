import { waitlistService } from "../services/waitlistService.js";

export const joinWaitlist = async (req, res) => {
  try {
    const result = await waitlistService.joinWaitlist(req.body);

    return res.status(200).json({
      success: true,
      message: "User added to waitlist successfully.",
      data: result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to join waitlist.",
    });
  }
};

export const getPosition = async (req, res) => {
  try {
    const { eventId, userId } = req.query;

    const position = await waitlistService.getPosition(eventId, userId);

    return res.json({
      success: true,
      data: position,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch waitlist position.",
    });
  }
};

export const autoEnroll = async (req, res) => {
  try {
    const { eventId } = req.body;

    const enrolled = await waitlistService.autoEnroll(eventId);

    return res.json({
      success: true,
      message: "Auto-enrollment completed.",
      data: enrolled,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Auto-enrollment failed.",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await waitlistService.notifications();

    return res.json({
      success: true,
      total: notifications.length,
      data: notifications,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const analytics = await waitlistService.analytics();

    return res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics.",
    });
  }
};

export const setDeadline = async (req, res) => {
  try {
    const { eventId, deadline } = req.body;

    const result = await waitlistService.setDeadline(eventId, deadline);

    return res.json({
      success: true,
      message: "Registration deadline updated.",
      data: result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to update registration deadline.",
    });
  }
};