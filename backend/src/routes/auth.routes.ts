import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as authController from "../controllers/auth.controller.js";
import * as passwordResetController from "../controllers/passwordReset.controller.js";

const router = Router();

// POST /api/auth/staff/login  | POST /api/auth/customer/login
router.post("/staff/login", asyncHandler(authController.staffLogin));
router.post("/customer/login", asyncHandler(authController.customerLogin));

// Customer-only password recovery via Gmail OTP (no staff equivalent)
router.post(
  "/customer/forgot-password",
  asyncHandler(passwordResetController.requestCustomerPasswordReset)
);
router.post(
  "/customer/reset-password",
  asyncHandler(passwordResetController.resetCustomerPassword)
);

export default router;
