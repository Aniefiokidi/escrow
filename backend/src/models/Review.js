import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

reviewSchema.index({ fromUser: 1, transaction: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
