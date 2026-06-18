import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { useNotifications } from "../context/NotificationContext";

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const fetchDetails = async () => {
    try {
      const { data } = await api.get(`/transactions/${id}`);
      setTransaction(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transaction");
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const respond = async (decision) => {
    try {
      await api.patch(`/transactions/${id}/respond`, { decision });
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed action");
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.patch(`/transactions/${id}/status`, { status });
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed status update");
    }
  };

  const approveMilestone = async (milestoneId) => {
    await api.patch(`/milestones/${milestoneId}/approve`);
    fetchDetails();
  };

  const releaseMilestone = async (milestoneId) => {
    await api.patch(`/milestones/${milestoneId}/release`);
    fetchDetails();
  };

  const cancelTransaction = async () => {
    if (!window.confirm("Cancel this transaction? This cannot be undone.")) return;
    try {
      const { data } = await api.patch(`/transactions/${id}/cancel`);
      setCancelMsg(data.message);
      refreshNotifications();
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel transaction");
    }
  };

  const submitReview = async () => {
    try {
      const toUserId = isBuyer ? transaction.seller?._id : transaction.buyer?._id;
      await api.post("/reviews", {
        transactionId: transaction._id,
        toUserId,
        rating,
        reviewText
      });
      setReviewText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (!transaction) {
    return <div className="card">Loading transaction...</div>;
  }

  const isBuyer = transaction.buyer?._id === user?._id;
  const isSeller = transaction.seller?._id === user?._id;

  return (
    <section className="details-wrap">
      {error && <p className="error-text">{error}</p>}
      <article className="card">
        <div className="tx-head">
          <h1>{transaction.title}</h1>
          <StatusBadge status={transaction.status} />
        </div>
        <p>{transaction.description}</p>
        <p className="amount">${transaction.amount.toFixed(2)}</p>
        <p>Progress: {transaction.progressPercentage}%</p>

        {isSeller && transaction.sellerDecision === "Pending" && (
          <div className="inline-actions">
            <button type="button" onClick={() => respond("accept")}>Accept</button>
            <button type="button" onClick={() => respond("reject")}>Reject</button>
          </div>
        )}

        {(isBuyer || isSeller) && (
          <div className="inline-actions">
            <button type="button" onClick={() => updateStatus("In Progress")}>Mark In Progress</button>
            <button type="button" onClick={() => updateStatus("Delivered")}>Mark Delivered</button>
          </div>
        )}
      </article>

      <article className="card">
        <h2>Milestones</h2>
        {transaction.milestones?.map((m) => (
          <div key={m._id} className="milestone-item">
            <p>
              #{m.sequence} - {m.description}
            </p>
            <p>${m.amount.toFixed(2)}</p>
            <StatusBadge status={m.status} />
            {isBuyer && m.status === "Pending" && (
              <button type="button" onClick={() => approveMilestone(m._id)}>
                Approve
              </button>
            )}
            {isBuyer && m.status === "Approved" && (
              <button type="button" onClick={() => releaseMilestone(m._id)}>
                Release Funds
              </button>
            )}
          </div>
        ))}
      </article>

      <article className="card">
        <h2>Rate Counterparty</h2>
        <div className="inline-actions">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((star) => (
              <option value={star} key={star}>
                {star} Star{star > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <input
            placeholder="Write review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <button type="button" onClick={submitReview}>
            Submit Review
          </button>
        </div>
      </article>

      {cancelMsg && (
        <article className="card" style={{ borderLeft: "4px solid #c9a84c" }}>
          <p style={{ fontWeight: 600 }}>{cancelMsg}</p>
        </article>
      )}

      {transaction.status !== "Cancelled" && transaction.status !== "Completed" && (isBuyer || isSeller) && (
        <article className="card">
          <h2>Cancel Transaction</h2>
          <p style={{ marginBottom: "0.8rem", color: "#6b7c99", fontSize: "0.9rem" }}>
            This will cancel the transaction and notify the other party.
          </p>
          <button
            type="button"
            onClick={cancelTransaction}
            style={{ background: "#b91c1c", borderRadius: "8px" }}
          >
            Cancel Transaction
          </button>
        </article>
      )}
    </section>
  );
}
