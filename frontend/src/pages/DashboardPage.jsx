import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get("/transactions");
        setTransactions(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    };

    fetchTransactions();
  }, []);

  return (
    <>
      <section className="hero-card">
        <h1>Escrow Command Center</h1>
        <p>Track deals, release milestones, and resolve disputes with confidence.</p>
      </section>

      {error && <p className="error-msg">{error}</p>}

      <section className="table-wrap">
        <div className="table-header">
          <h2>My Transactions</h2>
          <Link to="/transactions/new" className="primary-btn">
            New Transaction
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx._id}>
                <td>{tx.title}</td>
                <td>${tx.amount.toFixed(2)}</td>
                <td>
                  <StatusBadge status={tx.status} />
                </td>
                <td>{tx.progressPercentage || 0}%</td>
                <td>
                  <Link to={`/transactions/${tx._id}`}>View</Link>
                </td>
              </tr>
            ))}
            {!transactions.length && (
              <tr>
                <td colSpan={5}>No transactions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
