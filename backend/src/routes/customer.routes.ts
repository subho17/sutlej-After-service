import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as customerController from "../controllers/customer.controller.js";

const router = Router();

// GET /api/customers  | POST /api/customers
router.get("/", asyncHandler(customerController.listCustomers));
router.post("/", asyncHandler(customerController.createCustomer));

export default router;
