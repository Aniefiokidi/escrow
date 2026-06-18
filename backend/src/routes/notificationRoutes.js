import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
}));

router.patch("/:id/read", asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json(notification);
}));

router.patch("/read-all", asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
}));

export default router;
