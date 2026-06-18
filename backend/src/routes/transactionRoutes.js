import express from "express";
import {
  createTransaction,
  getMyTransactions,
  getTransactionById,
  respondToTransaction,
  updateTransactionStatus,
  cancelTransaction
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").post(createTransaction).get(getMyTransactions);
router.get("/:id", getTransactionById);
router.patch("/:id/respond", respondToTransaction);
router.patch("/:id/status", updateTransactionStatus);
router.patch("/:id/cancel", cancelTransaction);

export default router;
