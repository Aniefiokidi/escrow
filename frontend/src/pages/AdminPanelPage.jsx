import { useEffect, useState } from "react";
import { api } from "../api/client";

const outcomes = ["Refund Buyer", "Pay Seller", "Partial Refund"];

export default function AdminPanelPage() {
  const [disputes, setDisputes] = useState([]);
  const [error, setError] = useState("");

  const loadDisputes = async () => {
    try {
      const { data } = await api.get("/disputes");
      setDisputes(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin disputes");
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const resolve = async (disputeId, outcome, amount) => {
    try {
      await api.patch(`/disputes/${disputeId}/resolve`, {
        outcome,
        amountReleasedToSeller: outcome === "Pay Seller" ? amount : outcome === "Partial Refund" ? amount / 2 : 0,
        amountRefundedToBuyer: outcome === "Refund Buyer" ? amount : outcome === "Partial Refund" ? amount / 2 : 0,
        note: "Admin reviewed with AI recommendation"
      });
      loadDisputes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve dispute");
    }
  };

  return (
    <section>
      <h1>Admin Dispute Center</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="grid-list">
        {disputes.map((d) => (
          <article className="card" key={d._id}>
            <p><strong>Tx:</strong> {d.transaction?.title}</p>
            <p><strong>Reason:</strong> {d.reason}</p>
            <p>
              <strong>AI Recommendation:</strong> {d.aiRecommendation?.winner} likely to win
              ({Math.round((d.aiRecommendation?.confidence || 0) * 100)}% confidence)
            </p>
            <p><strong>AI Notes:</strong> {d.aiRecommendation?.explanation}</p>
            <p><strong>Status:</strong> {d.status}</p>
            {d.status === "Open" && (
              <div className="inline-actions">
                {outcomes.map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => resolve(d._id, outcome, d.transaction?.amount || 0)}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
