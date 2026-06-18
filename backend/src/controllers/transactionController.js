import Milestone from "../models/Milestone.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { recalculateTrustScore } from "../services/trustScoreService.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const { title, description, amount, sellerEmail, sellerId, dueDate } = req.body;

  if (!title || !description || !amount || (!sellerEmail && !sellerId)) {
    res.status(400);
    throw new Error("Title, description, amount, and seller reference are required");
  }

  const seller = sellerId
    ? await User.findById(sellerId)
    : await User.findOne({ email: (sellerEmail || "").toLowerCase() });

  if (!seller) {
    res.status(404);
    throw new Error("Seller not found");
  }

  const transaction = await Transaction.create({
    title,
    description,
    amount,
    buyer: req.user._id,
    seller: seller._id,
    status: "Pending",
    sellerDecision: "Pending",
    metadata: {
      dueDate: dueDate ? new Date(dueDate) : undefined
    }
  });

  res.status(201).json(transaction);
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const filter = req.user.role === "buyer"
    ? { buyer: req.user._id }
    : req.user.role === "seller"
      ? { seller: req.user._id }
      : {};

  const transactions = await Transaction.find(filter)
    .populate("buyer", "name email trustScore")
    .populate("seller", "name email trustScore")
    .sort({ createdAt: -1 });

  res.json(transactions);
});

export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("buyer", "name email trustScore")
    .populate("seller", "name email trustScore");

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  const milestones = await Milestone.find({ transaction: transaction._id }).sort({ sequence: 1 });

  res.json({ ...transaction.toObject(), milestones });
});

export const respondToTransaction = asyncHandler(async (req, res) => {
  const { decision } = req.body;

  if (!["accept", "reject"].includes((decision || "").toLowerCase())) {
    res.status(400);
    throw new Error("Decision must be accept or reject");
  }

  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  if (String(transaction.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the assigned seller can respond");
  }

  if (decision.toLowerCase() === "accept") {
    transaction.sellerDecision = "Accepted";
    transaction.status = "In Escrow";
    transaction.escrowHeld = true;
  } else {
    transaction.sellerDecision = "Rejected";
    transaction.status = "Pending";
    transaction.escrowHeld = false;
  }

  await transaction.save();
  res.json(transaction);
});

export const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { status, deliveryConfirmed } = req.body;
  const allowed = ["In Progress", "Delivered", "Completed", "Disputed"];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(", ")}`);
  }

  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  const isBuyer = String(transaction.buyer) === String(req.user._id);
  const isSeller = String(transaction.seller) === String(req.user._id);

  if (!isBuyer && !isSeller && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not allowed to update this transaction");
  }

  transaction.status = status;
  if (typeof deliveryConfirmed !== "undefined") {
    transaction.metadata.deliveryConfirmed = Boolean(deliveryConfirmed);
  }
  if (status === "Delivered") {
    transaction.metadata.deliveryDate = new Date();
    if (transaction.metadata.dueDate && transaction.metadata.deliveryDate > transaction.metadata.dueDate) {
      const seller = await User.findById(transaction.seller);
      if (seller) {
        seller.stats.lateDeliveries += 1;
        await seller.save();
        await recalculateTrustScore(seller._id);
      }
    }
  }

  if (status === "Completed") {
    const buyer = await User.findById(transaction.buyer);
    const seller = await User.findById(transaction.seller);
    if (buyer) {
      buyer.stats.completedTransactions += 1;
      await buyer.save();
      await recalculateTrustScore(buyer._id);
    }
    if (seller) {
      seller.stats.completedTransactions += 1;
      await seller.save();
      await recalculateTrustScore(seller._id);
    }
  }

  await transaction.save();
  res.json(transaction);
});

export const cancelTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("buyer", "name email")
    .populate("seller", "name email");

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  const isBuyer = String(transaction.buyer._id) === String(req.user._id);
  const isSeller = String(transaction.seller._id) === String(req.user._id);

  if (!isBuyer && !isSeller) {
    res.status(403);
    throw new Error("Only the buyer or seller can cancel this transaction");
  }

  if (transaction.status === "Cancelled") {
    res.status(400);
    throw new Error("Transaction is already cancelled");
  }

  transaction.status = "Cancelled";
  await transaction.save();

  const cancellerRole = isBuyer ? "buyer" : "seller";
  const cancellerName = isBuyer ? transaction.buyer.name : transaction.seller.name;
  const cancellerEmail = isBuyer ? transaction.buyer.email : transaction.seller.email;
  const otherParty = isBuyer ? transaction.seller : transaction.buyer;
  const otherRole = isBuyer ? "seller" : "buyer";

  await Notification.create({
    user: otherParty._id,
    message: `Transaction "${transaction.title}" was cancelled by the ${cancellerRole}. Contact ${cancellerName} (${cancellerEmail}) for more information.`,
    type: "cancelled",
    relatedTransaction: transaction._id
  });

  await Notification.create({
    user: req.user._id,
    message: `You cancelled transaction "${transaction.title}". The ${otherRole} (${otherParty.name}) has been notified.`,
    type: "info",
    relatedTransaction: transaction._id
  });

  res.json({ message: "Transaction cancelled successfully", transaction });
});
