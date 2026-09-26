import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// POST /api/auth/staff/login  | POST /api/auth/customer/login
router.post("/staff/login", asyncHandler(authController.staffLogin));
router.post("/customer/login", asyncHandler(authController.customerLogin));

export default router;
