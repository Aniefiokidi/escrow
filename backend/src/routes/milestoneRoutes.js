import express from "express";
import {
  approveMilestone,
  createMilestones,
  listMilestones,
  releaseMilestone
} from "../controllers/milestoneController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/transaction/:transactionId", createMilestones);
router.get("/transaction/:transactionId", listMilestones);
router.patch("/:id/approve", approveMilestone);
router.patch("/:id/release", releaseMilestone);

export default router;
