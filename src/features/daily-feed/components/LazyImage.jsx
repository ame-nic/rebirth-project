import { useEffect, useRef, useState } from "react";
import { C } from "../../../shared/design/tokens.js";

/* IntersectionObserver-backed lazy image. Native `loading="lazy"` works
   too but gives us no placeholder control and Safari's heuristic is
   sometimes too aggressive — this version paints a placeholder block
   immediately and crossfades the image once it loads. */
export default function LazyImage({ src, alt = "", width = 56, height = 56, style = {} }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src || !ref.current) return;
    if (inView) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { rootMargin: "120px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [src, inView]);

  return (
    <div
      ref={ref}
      style={{
        width, height, borderRadius: 4, flexShrink: 0,
        background: C.bg, overflow: "hidden", position: "relative",
        ...style,
      }}
    >
      {inView && src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      )}
    </div>
  );
}
