import { portfolioAnalyticsService } from "../services/portfolioAnalyticsService.js";

export async function getPortfolioAnalytics(req, res) {
  try {
    const analytics =
      await portfolioAnalyticsService.getAnalytics(
        req.params.username
      );

    res.json({
      success: true,
      analytics,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export async function recordPortfolioVisit(req, res) {
  try {
    const response =
      await portfolioAnalyticsService.recordVisit(
        req.params.username
      );

    res.json(response);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

export async function getMonthlyReport(req, res) {
  try {
    const report =
      await portfolioAnalyticsService.getMonthlyReport(
        req.params.username
      );

    res.json({
      success: true,
      report,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}