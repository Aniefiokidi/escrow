import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Pending", "In Escrow", "In Progress", "Delivered", "Completed", "Disputed"],
      default: "Pending"
    },
    escrowHeld: { type: Boolean, default: false },
    sellerDecision: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending"
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    metadata: {
      deliveryConfirmed: { type: Boolean, default: false },
      deliveryDate: Date,
      dueDate: Date
    }
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
