import User from "../models/User.js";
import Review from "../models/Review.js";

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

export const recalculateTrustScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const baseScore = 50;
  const completedBoost = user.stats.completedTransactions * 3;
  const disputePenalty = user.stats.disputesCount * 4;
  const latePenalty = user.stats.lateDeliveries * 3;

  const ratings = await Review.find({ toUser: userId }).select("rating");
  const avgRating = ratings.length
    ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
    : 0;

  const ratingBoost = avgRating > 0 ? avgRating * 5 : 0;

  user.stats.avgRating = Number(avgRating.toFixed(2));
  user.stats.ratingsCount = ratings.length;
  user.trustScore = clampScore(baseScore + completedBoost + ratingBoost - disputePenalty - latePenalty);

  await user.save();
  return user;
};
