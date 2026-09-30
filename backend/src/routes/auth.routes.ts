import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as authController from "../controllers/auth.controller.js";
import * as signupController from "../controllers/signup.controller.js";
import * as passwordResetController from "../controllers/passwordReset.controller.js";

const router = Router();

// POST /api/auth/staff/login  | POST /api/auth/customer/login
router.post("/staff/login", asyncHandler(authController.staffLogin));
router.post("/customer/login", asyncHandler(authController.customerLogin));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", requireAuth, asyncHandler(authController.me));

// Customer signup — direct account + vehicle creation (no OTP)
router.post("/customer/signup", asyncHandler(signupController.signup));

// Customer password recovery via Gmail OTP (code goes to customer's email)
router.post(
  "/customer/forgot-password",
  asyncHandler(passwordResetController.requestCustomerPasswordReset)
);
router.post(
  "/customer/reset-password",
  asyncHandler(passwordResetController.resetCustomerPassword)
);

// Staff password recovery — OTP goes to the fixed admin inbox,
// never to the staff member's own email
router.post(
  "/staff/forgot-password",
  asyncHandler(passwordResetController.requestStaffPasswordReset)
);
router.post(
  "/staff/reset-password",
  asyncHandler(passwordResetController.resetStaffPassword)
);

export default router;
