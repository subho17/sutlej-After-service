import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as staffController from "../controllers/staff.controller.js";

const router = Router();

// Staff directory is staff-only.
router.use(requireAuth, requireRole("staff"));

// GET /api/staff  | POST /api/staff
router.get("/", asyncHandler(staffController.listStaffHandler));
router.post("/", asyncHandler(staffController.createStaffHandler));

export default router;
