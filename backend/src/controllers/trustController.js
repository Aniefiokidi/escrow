import { recalculateTrustScore } from "../services/trustScoreService.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const recalculateUserTrust = asyncHandler(async (req, res) => {
  const user = await recalculateTrustScore(req.params.userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ userId: user._id, trustScore: user.trustScore, stats: user.stats });
});
