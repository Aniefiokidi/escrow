import Milestone from "../models/Milestone.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middleware/asyncHandler.js";

const updateTransactionProgress = async (transactionId) => {
  const milestones = await Milestone.find({ transaction: transactionId });
  if (!milestones.length) return;

  const releasedAmount = milestones
    .filter((m) => m.status === "Released")
    .reduce((sum, m) => sum + m.amount, 0);
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);

  const progress = totalAmount > 0 ? Math.round((releasedAmount / totalAmount) * 100) : 0;
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) return;

  transaction.progressPercentage = progress;
  if (progress > 0 && progress < 100) transaction.status = "In Progress";
  if (progress === 100) transaction.status = "Completed";

  await transaction.save();
};

export const createMilestones = asyncHandler(async (req, res) => {
  const { milestones } = req.body;
  const transaction = await Transaction.findById(req.params.transactionId);

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  if (String(transaction.buyer) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only buyer can create milestones");
  }

  if (!Array.isArray(milestones) || milestones.length === 0) {
    res.status(400);
    throw new Error("Milestones array is required");
  }

  const total = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  if (Number(total.toFixed(2)) !== Number(transaction.amount.toFixed(2))) {
    res.status(400);
    throw new Error("Sum of milestone amounts must equal transaction amount");
  }

  await Milestone.deleteMany({ transaction: transaction._id });

  const docs = milestones.map((m, index) => ({
    transaction: transaction._id,
    buyer: transaction.buyer,
    seller: transaction.seller,
    description: m.description,
    amount: Number(m.amount),
    sequence: index + 1
  }));

  const created = await Milestone.insertMany(docs);
  await updateTransactionProgress(transaction._id);

  res.status(201).json(created);
});

export const listMilestones = asyncHandler(async (req, res) => {
  const milestones = await Milestone.find({ transaction: req.params.transactionId }).sort({ sequence: 1 });
  res.json(milestones);
});

export const approveMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) {
    res.status(404);
    throw new Error("Milestone not found");
  }

  if (String(milestone.buyer) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only buyer can approve milestones");
  }

  milestone.status = "Approved";
  milestone.approvedAt = new Date();
  await milestone.save();

  res.json(milestone);
});

export const releaseMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id);
  if (!milestone) {
    res.status(404);
    throw new Error("Milestone not found");
  }

  if (String(milestone.buyer) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only buyer can release milestones");
  }

  if (milestone.status !== "Approved") {
    res.status(400);
    throw new Error("Milestone must be approved before release");
  }

  milestone.status = "Released";
  milestone.releasedAt = new Date();
  await milestone.save();

  await updateTransactionProgress(milestone.transaction);

  res.json(milestone);
});
