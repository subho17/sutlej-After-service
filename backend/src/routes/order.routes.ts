import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as orderController from "../controllers/order.controller.js";

const router = Router();

router.use(requireAuth);

// GET /api/orders  | POST /api/orders
router.get("/", asyncHandler(orderController.listOrdersHandler));
router.post("/", asyncHandler(orderController.createOrderHandler));

// Staff-only: sync a status move back to Supabase
router.patch(
  "/by-no/:orderNo/status",
  requireRole("staff"),
  asyncHandler(orderController.updateOrderStatusHandler)
);

export default router;
