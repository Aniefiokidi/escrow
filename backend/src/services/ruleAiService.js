export const getRuleBasedRecommendation = ({
  reason,
  deliveryConfirmed,
  buyerTrust,
  sellerTrust,
  sellerPastDisputes,
  hasSellerEvidence
}) => {
  const reasonLower = (reason || "").toLowerCase();

  if (!deliveryConfirmed && !hasSellerEvidence) {
    return {
      winner: "buyer",
      confidence: 0.85,
      explanation: "No delivery proof found; rule engine favors buyer."
    };
  }

  if (
    deliveryConfirmed &&
    hasSellerEvidence &&
    sellerTrust >= 65 &&
    sellerPastDisputes <= 2 &&
    !reasonLower.includes("fraud")
  ) {
    return {
      winner: "seller",
      confidence: 0.82,
      explanation: "Delivery confirmed with supporting evidence and high seller trust."
    };
  }

  if (buyerTrust < 40 && sellerTrust > 60) {
    return {
      winner: "seller",
      confidence: 0.7,
      explanation: "Seller credibility currently stronger than buyer profile."
    };
  }

  return {
    winner: "admin",
    confidence: 0.55,
    explanation: "Signals are mixed; case should be manually reviewed by admin."
  };
};
