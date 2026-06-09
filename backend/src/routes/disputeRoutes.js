import express from "express";
import {
  createDispute,
  listDisputes,
  resolveDispute,
  uploadDisputeFile
} from "../controllers/disputeController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/upload", upload.single("file"), uploadDisputeFile);
router.post("/", createDispute);
router.get("/", listDisputes);
router.patch("/:id/resolve", authorize("admin"), resolveDispute);

export default router;
