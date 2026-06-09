import express from "express";
import { recalculateUserTrust } from "../controllers/trustController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.patch("/:userId/recalculate", authorize("admin"), recalculateUserTrust);

export default router;
