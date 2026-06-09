import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Stars from "../components/Stars";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ bio: "", phone: "", country: "", avatarUrl: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.profile) {
      setForm({
        bio: user.profile.bio || "",
        phone: user.profile.phone || "",
        country: user.profile.country || "",
        avatarUrl: user.profile.avatarUrl || ""
      });
    }
  }, [user]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!user?._id) return;
      try {
        const { data } = await api.get(`/reviews/user/${user._id}`);
        setReviews(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load reviews");
      }
    };

    loadReviews();
  }, [user?._id]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.put("/auth/me", form);
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <section className="split-grid">
      <article className="card">
        <h1>{user?.name}</h1>
        <p>{user?.email}</p>
        <p className="trust-pill">Trust Score: {user?.trustScore ?? 0}/100</p>
        <p>Role: {user?.role}</p>

        <form className="form-grid" onSubmit={updateProfile}>
          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <input
            placeholder="Country"
            value={form.country}
            onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
          />
          <input
            placeholder="Avatar URL"
            value={form.avatarUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
          />
          <button type="submit">Save Profile</button>
        </form>
      </article>

      <article className="card">
        <h2>Reviews</h2>
        {error && <p className="error-text">{error}</p>}
        {reviews.map((review) => (
          <div key={review._id} className="list-item">
            <p>{review.fromUser?.name}</p>
            <Stars rating={review.rating} />
            <p>{review.reviewText}</p>
          </div>
        ))}
        {!reviews.length && <p>No reviews yet.</p>}
      </article>
    </section>
  );
}
