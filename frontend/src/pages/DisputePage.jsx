import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function DisputePage() {
  const [disputes, setDisputes] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [reason, setReason] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const loadDisputes = async () => {
    try {
      const { data } = await api.get("/disputes");
      setDisputes(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load disputes");
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const submitDispute = async (event) => {
    event.preventDefault();
    setError("");

    try {
      let fileUrl = "";
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const uploadRes = await api.post("/disputes/upload", body, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        fileUrl = uploadRes.data.fileUrl;
      }

      await api.post("/disputes", {
        transactionId,
        reason,
        evidence: [
          {
            text: evidenceText,
            fileUrl,
            metadata: "Submitted from dispute page"
          }
        ]
      });

      setTransactionId("");
      setReason("");
      setEvidenceText("");
      setFile(null);
      await loadDisputes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open dispute");
    }
  };

  return (
    <section className="split-grid">
      <article className="card">
        <h1>Open Dispute</h1>
        {error && <p className="error-text">{error}</p>}
        <form className="form-grid" onSubmit={submitDispute}>
          <input
            placeholder="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            required
          />
          <textarea
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <textarea
            placeholder="Evidence text"
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
          />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="submit">Submit Dispute</button>
        </form>
      </article>

      <article className="card">
        <h2>Dispute List</h2>
        {disputes.map((dispute) => (
          <div key={dispute._id} className="list-item">
            <p><strong>Reason:</strong> {dispute.reason}</p>
            <p>
              <strong>AI Recommendation:</strong> {dispute.aiRecommendation?.winner} likely to win
              ({Math.round((dispute.aiRecommendation?.confidence || 0) * 100)}% confidence)
            </p>
            <p><strong>Status:</strong> {dispute.status}</p>
          </div>
        ))}
      </article>
    </section>
  );
}
