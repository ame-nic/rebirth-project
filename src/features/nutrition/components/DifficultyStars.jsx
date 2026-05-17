import { C } from "../../../shared/design/tokens.js";

export default function DifficultyStars({ value = 1, size = 11 }) {
  const safe = Math.max(1, Math.min(3, value));
  return (
    <span style={{ display: "inline-flex", gap: 1, color: C.sport, lineHeight: 1 }}>
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className={`ph ${i < safe ? "ph-star-fill" : "ph-star"}`}
          style={{ fontSize: size, color: i < safe ? C.sport : C.txtMute }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
