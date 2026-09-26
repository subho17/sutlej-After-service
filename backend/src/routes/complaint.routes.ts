import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as complaintController from "../controllers/complaint.controller.js";

const router = Router();

// GET /api/complaints  | POST /api/complaints
router.get("/", asyncHandler(complaintController.listComplaints));
router.post("/", asyncHandler(complaintController.createComplaint));

export default router;
