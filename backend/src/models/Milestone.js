import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    sequence: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Released"],
      default: "Pending"
    },
    approvedAt: Date,
    releasedAt: Date
  },
  { timestamps: true }
);

milestoneSchema.index({ transaction: 1, sequence: 1 }, { unique: true });

const Milestone = mongoose.model("Milestone", milestoneSchema);
export default Milestone;
