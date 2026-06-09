import Dispute from "../models/Dispute.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { getRuleBasedRecommendation } from "../services/ruleAiService.js";
import { recalculateTrustScore } from "../services/trustScoreService.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const createDispute = asyncHandler(async (req, res) => {
  const { transactionId, reason, evidence = [] } = req.body;

  if (!transactionId || !reason) {
    res.status(400);
    throw new Error("transactionId and reason are required");
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  const isBuyer = String(transaction.buyer) === String(req.user._id);
  const isSeller = String(transaction.seller) === String(req.user._id);
  if (!isBuyer && !isSeller) {
    res.status(403);
    throw new Error("Only transaction participants can open a dispute");
  }

  const existing = await Dispute.findOne({ transaction: transactionId });
  if (existing) {
    res.status(400);
    throw new Error("Dispute already exists for this transaction");
  }

  const buyer = await User.findById(transaction.buyer);
  const seller = await User.findById(transaction.seller);

  const hasSellerEvidence = evidence.some((item) => item.fileUrl || item.text);

  const aiRecommendation = getRuleBasedRecommendation({
    reason,
    deliveryConfirmed: transaction.metadata.deliveryConfirmed,
    buyerTrust: buyer?.trustScore || 50,
    sellerTrust: seller?.trustScore || 50,
    sellerPastDisputes: seller?.stats.disputesCount || 0,
    hasSellerEvidence
  });

  const dispute = await Dispute.create({
    transaction: transactionId,
    openedBy: req.user._id,
    reason,
    evidence,
    aiRecommendation
  });

  transaction.status = "Disputed";
  transaction.escrowHeld = true;
  await transaction.save();

  if (buyer) {
    buyer.stats.disputesCount += 1;
    await buyer.save();
    await recalculateTrustScore(buyer._id);
  }
  if (seller) {
    seller.stats.disputesCount += 1;
    await seller.save();
    await recalculateTrustScore(seller._id);
  }

  res.status(201).json(dispute);
});

export const listDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find()
    .populate("transaction", "title amount status buyer seller")
    .populate("openedBy", "name email role trustScore")
    .sort({ createdAt: -1 });

  if (req.user.role === "admin") {
    return res.json(disputes);
  }

  const filtered = disputes.filter((d) => {
    const tx = d.transaction;
    if (!tx) return false;
    return String(tx.buyer) === String(req.user._id) || String(tx.seller) === String(req.user._id);
  });

  return res.json(filtered);
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const { outcome, amountReleasedToSeller = 0, amountRefundedToBuyer = 0, note = "" } = req.body;

  const allowedOutcomes = ["Refund Buyer", "Pay Seller", "Partial Refund"];
  if (!allowedOutcomes.includes(outcome)) {
    res.status(400);
    throw new Error(`Outcome must be one of: ${allowedOutcomes.join(", ")}`);
  }

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    res.status(404);
    throw new Error("Dispute not found");
  }

  dispute.status = "Resolved";
  dispute.finalDecision = {
    outcome,
    amountReleasedToSeller,
    amountRefundedToBuyer,
    decidedBy: req.user._id,
    note
  };
  await dispute.save();

  const transaction = await Transaction.findById(dispute.transaction);
  if (transaction) {
    transaction.status = outcome === "Pay Seller" ? "Completed" : "In Escrow";
    transaction.escrowHeld = outcome !== "Pay Seller";
    await transaction.save();
  }

  res.json(dispute);
});

export const uploadDisputeFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("File is required");
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.status(201).json({ fileUrl, filename: req.file.filename });
});
