import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as complaintController from "../controllers/complaint.controller.js";

const router = Router();

router.use(requireAuth);

// GET /api/complaints  | POST /api/complaints
router.get("/", asyncHandler(complaintController.listComplaintsHandler));
router.post("/", asyncHandler(complaintController.createComplaintHandler));

export default router;
