import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as customerController from "../controllers/customer.controller.js";

const router = Router();

router.use(requireAuth);

// GET /api/customers  | POST /api/customers
router.get("/", asyncHandler(customerController.listCustomersHandler));
router.post("/", asyncHandler(customerController.createCustomerHandler));

export default router;
