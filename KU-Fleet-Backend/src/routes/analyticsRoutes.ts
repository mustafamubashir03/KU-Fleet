import express from "express";
import { getAlertTrends, getBusAnalytics, getDriverAnalytics, getFeedbackAnalytics, getFleetOverview, getFleetTimeseries, getRouteAnalytics } from "../controllers/analyticsController";

const router = express.Router();

router.get("/overview", getFleetOverview);
router.get("/bus/:id", getBusAnalytics);
router.get("/driver/:id", getDriverAnalytics);
router.get("/routes", getRouteAnalytics);
router.get("/alerts", getAlertTrends);
router.get("/feedback", getFeedbackAnalytics);
router.get("/timeseries", getFleetTimeseries);

export default router;
