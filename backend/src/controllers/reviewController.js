import Review from "../models/Review.js";
import Transaction from "../models/Transaction.js";
import { recalculateTrustScore } from "../services/trustScoreService.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const createReview = asyncHandler(async (req, res) => {
  const { transactionId, toUserId, rating, reviewText } = req.body;

  if (!transactionId || !toUserId || !rating) {
    res.status(400);
    throw new Error("transactionId, toUserId, and rating are required");
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  const isParty =
    String(transaction.buyer) === String(req.user._id) ||
    String(transaction.seller) === String(req.user._id);

  if (!isParty) {
    res.status(403);
    throw new Error("Only buyer or seller of transaction can review");
  }

  const review = await Review.create({
    fromUser: req.user._id,
    toUser: toUserId,
    transaction: transactionId,
    rating,
    reviewText: reviewText || ""
  });

  await recalculateTrustScore(toUserId);

  res.status(201).json(review);
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ toUser: req.params.userId })
    .populate("fromUser", "name role trustScore")
    .sort({ createdAt: -1 });
  res.json(reviews);
});
