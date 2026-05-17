import { useCallback, useEffect, useRef, useState } from "react";

/* Lightweight virtual scroll via IntersectionObserver. Avoids pulling
   in react-window or similar — our cards are uniformly sized and the
   feed maxes out around 100 items, so a sentinel-based "load 8 more
   when you're 200px from the bottom" pattern is plenty. */

const INITIAL_COUNT   = 12;
const LOAD_MORE_COUNT = 8;

export default function VirtualFeedList({ items, renderItem }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef(null);

  // Note: reset of visibleCount on "list identity change" is handled by
  // the parent passing a `key` (e.g. the active filter). That way scroll
  // position survives a background revalidation update — only deliberate
  // navigation (filter switch) collapses back to the top.

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, items.length));
  }, [items.length]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (visibleCount >= items.length) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" },
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore, visibleCount, items.length]);

  return (
    <>
      {items.slice(0, visibleCount).map((item) => renderItem(item))}
      {visibleCount < items.length && (
        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      )}
    </>
  );
}
