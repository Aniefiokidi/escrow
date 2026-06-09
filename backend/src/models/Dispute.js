import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    metadata: { type: String, default: "" }
  },
  { _id: false }
);

const disputeSchema = new mongoose.Schema(
  {
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true, unique: true },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true },
    evidence: [evidenceSchema],
    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open"
    },
    aiRecommendation: {
      winner: { type: String, enum: ["buyer", "seller", "admin"], default: "admin" },
      confidence: { type: Number, default: 0 },
      explanation: { type: String, default: "" }
    },
    finalDecision: {
      outcome: {
        type: String,
        enum: ["Refund Buyer", "Pay Seller", "Partial Refund", "Pending"],
        default: "Pending"
      },
      amountReleasedToSeller: { type: Number, default: 0 },
      amountRefundedToBuyer: { type: Number, default: 0 },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

const Dispute = mongoose.model("Dispute", disputeSchema);
export default Dispute;
