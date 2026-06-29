// Assuming you have a database utility or Supabase client setup at server/config/db
const supabase = require('../config/supabaseClient');

exports.trackEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid payload: "events" array is required.' });
    }

    // Validate and sanitize data items inside the batch
    const sanitizedEvents = events.map((event) => ({
      event_type: event.eventType || 'unknown',
      element_clicked: event.elementClicked || null,
      page_url: event.pageUrl || 'unknown',
      timestamp: event.timestamp || new Date().toISOString(),
      session_id: event.sessionId || 'anonymous', // Anonymized session identifier from frontend
    }));

    // Insert array of objects directly into your Supabase/Postgre table named 'user_analytics'
    const { data, error } = await supabase.from('user_analytics').insert(sanitizedEvents);

    if (error) throw error;

    return res.status(201).json({ success: true, message: 'Batch events recorded successfully.' });
  } catch (error) {
    console.error('Analytics Backend Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error tracking analytics.' });
  }
};
