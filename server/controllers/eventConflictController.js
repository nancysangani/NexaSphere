import { eventConflictService } from "../services/eventConflictService.js";

export const getConflicts = async (req, res) => {
  try {
    const conflicts = await eventConflictService.checkConflicts();

    return res.json({
      success: true,
      total: conflicts.length,
      conflicts,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to check event conflicts.",
    });
  }
};

export const getVenueAvailability = async (req, res) => {
  try {
    const { venue, date } = req.query;

    if (!venue || !date) {
      return res.status(400).json({
        success: false,
        message: "Venue and date are required.",
      });
    }

    const result = await eventConflictService.checkVenueAvailability(
      venue,
      date
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to check venue availability.",
    });
  }
};

export const getAttendanceImpact = async (req, res) => {
  try {
    const impact = await eventConflictService.attendanceImpact();

    return res.json({
      success: true,
      data: impact,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to generate attendance analysis.",
    });
  }
};

export const getScheduleRecommendations = async (req, res) => {
  try {
    const recommendations =
      await eventConflictService.scheduleRecommendation();

    return res.json({
      success: true,
      data: recommendations,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations.",
    });
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    const events = await eventConflictService.calendarEvents();

    return res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to load calendar events.",
    });
  }
};

export const getOrganizerAlerts = async (req, res) => {
  try {
    const alerts = await eventConflictService.getAlerts();

    return res.json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to load organizer alerts.",
    });
  }
};