import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as vehicleController from "../controllers/vehicle.controller.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(vehicleController.listVehiclesHandler));
router.post("/", requireAuth, asyncHandler(vehicleController.createVehicleHandler));

export default router;
