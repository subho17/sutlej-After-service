import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as announcementController from "../controllers/announcement.controller.js";

const router = Router();

// Public: customer portal home reads active announcements.
router.get("/", asyncHandler(announcementController.listAnnouncementsHandler));

// Staff-only writes.
router.post(
  "/",
  requireAuth,
  requireRole("staff"),
  asyncHandler(announcementController.createAnnouncementHandler)
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("staff"),
  asyncHandler(announcementController.deleteAnnouncementHandler)
);

export default router;
