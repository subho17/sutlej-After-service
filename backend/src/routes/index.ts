import { Router } from "express";
import authRoutes from "./auth.routes.js";
import staffRoutes from "./staff.routes.js";
import customerRoutes from "./customer.routes.js";
import complaintRoutes from "./complaint.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "after-service-sutlej-backend", time: new Date().toISOString() });
});

// Mount feature routers here — new feature = new file + one line below.
router.use("/auth", authRoutes);
router.use("/staff", staffRoutes);
router.use("/customers", customerRoutes);
router.use("/complaints", complaintRoutes);

export default router;
