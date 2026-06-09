export default function Stars({ rating = 0 }) {
  const rounded = Math.round(rating);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "star filled" : "star"}>
          ★
        </span>
      ))}
    </div>
  );
}
