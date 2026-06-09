import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const emptyMilestone = { description: "", amount: "" };

export default function CreateTransactionPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    sellerEmail: ""
  });
  const [milestones, setMilestones] = useState([
    { ...emptyMilestone },
    { ...emptyMilestone },
    { ...emptyMilestone }
  ]);
  const [error, setError] = useState("");

  const updateMilestone = (index, field, value) => {
    setMilestones((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const { data: tx } = await api.post("/transactions", {
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        sellerEmail: form.sellerEmail
      });

      const validMilestones = milestones
        .filter((m) => m.description && m.amount)
        .map((m) => ({ description: m.description, amount: Number(m.amount) }));

      if (validMilestones.length > 0) {
        await api.post(`/milestones/transaction/${tx._id}`, {
          milestones: validMilestones
        });
      }

      navigate(`/transactions/${tx._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create transaction");
    }
  };

  return (
    <section className="card form-card">
      <h1>Create Escrow Transaction</h1>
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={onSubmit} className="form-grid">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          required
        />
        <input
          type="number"
          min="1"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Seller email"
          value={form.sellerEmail}
          onChange={(e) => setForm((prev) => ({ ...prev, sellerEmail: e.target.value }))}
          required
        />

        <h3>Milestones</h3>
        {milestones.map((milestone, index) => (
          <div className="milestone-row" key={index}>
            <input
              placeholder={`Milestone ${index + 1} description`}
              value={milestone.description}
              onChange={(e) => updateMilestone(index, "description", e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={milestone.amount}
              onChange={(e) => updateMilestone(index, "amount", e.target.value)}
            />
          </div>
        ))}

        <button type="submit">Create Transaction</button>
      </form>
    </section>
  );
}
