import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as staffController from "../controllers/staff.controller.js";

const router = Router();

// GET /api/staff  | POST /api/staff
router.get("/", asyncHandler(staffController.listStaff));
router.post("/", asyncHandler(staffController.createStaff));

export default router;
