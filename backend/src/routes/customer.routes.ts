import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as customerController from "../controllers/customer.controller.js";

const router = Router();

router.use(requireAuth);

// Staff directory listing. Staff-only: every row carries the customer's phone
// and email, so leaving this to plain requireAuth would let any signed-in
// customer enumerate the whole customer base.
router.get("/", requireRole("staff"), asyncHandler(customerController.listCustomersHandler));
router.post("/", requireRole("staff"), asyncHandler(customerController.createCustomerHandler));

// GET /api/customers/me — signed-in customer's own profile (phone, email)
router.get("/me", asyncHandler(customerController.currentCustomerHandler));

export default router;
