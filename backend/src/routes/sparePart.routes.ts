import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as ctrl from "../controllers/sparePart.controller.js";

const router = Router();

router.get("/", asyncHandler(ctrl.listSparePartsHandler));
router.post("/", requireAuth, requireRole("staff"), asyncHandler(ctrl.createSparePartHandler));
router.patch("/:sku", requireAuth, requireRole("staff"), asyncHandler(ctrl.updateSparePartHandler));
router.delete("/:sku", requireAuth, requireRole("staff"), asyncHandler(ctrl.deleteSparePartHandler));

export default router;
