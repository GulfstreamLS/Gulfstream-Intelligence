"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DisplayMessage } from "../../types/chat";

interface Metrics {
  thumbTop: number;
  thumbHeight: number;
  markers: number[];
  scrollable: boolean;
}

export function ChatScrollbar({
  scrollContainerRef,
  messages,
}: {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messages: DisplayMessage[];
}) {
  const [metrics, setMetrics] = useState<Metrics>({
    thumbTop: 0,
    thumbHeight: 0,
    markers: [],
    scrollable: false,
  });
  const [hovered, setHovered] = useState(false);

  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  const compute = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const trackH = clientHeight;

    if (scrollHeight <= clientHeight + 2) {
      setMetrics(m => ({ ...m, scrollable: false }));
      return;
    }

    const thumbH = Math.max(40, (clientHeight / scrollHeight) * trackH);
    const maxScroll = scrollHeight - clientHeight;
    const thumbT = maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumbH) : 0;

    const markers: number[] = [];
    el.querySelectorAll<HTMLElement>("[data-msg-role='user']").forEach(msgEl => {
      const mid = msgEl.offsetTop + msgEl.offsetHeight / 2;
      const pos = (mid / scrollHeight) * trackH;
      if (pos >= 0 && pos <= trackH) markers.push(pos);
    });

    setMetrics({ thumbTop: thumbT, thumbHeight: thumbH, markers, scrollable: true });
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", compute, { passive: true });

    const ro = new ResizeObserver(compute);
    ro.observe(el);

    const mo = new MutationObserver(compute);
    mo.observe(el, { childList: true, subtree: true, attributes: false, characterData: false });

    compute();

    return () => {
      el.removeEventListener("scroll", compute);
      ro.disconnect();
      mo.disconnect();
    };
  }, [scrollContainerRef, compute]);

  useEffect(() => { compute(); }, [messages, compute]);

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    el.scrollTo({ top: ratio * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
  }, [scrollContainerRef]);

  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = scrollContainerRef.current?.scrollTop ?? 0;

    const onMove = (ev: MouseEvent) => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const trackH = el.clientHeight;
      const thumbH = Math.max(40, (el.clientHeight / el.scrollHeight) * trackH);
      const ratio = (ev.clientY - dragStartY.current) / (trackH - thumbH);
      el.scrollTop = dragStartScrollTop.current + ratio * (el.scrollHeight - el.clientHeight);
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [scrollContainerRef]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleTrackClick}
      className="absolute -right-1.5 top-0 bottom-0 z-20 cursor-pointer select-none"
      style={{
        width: 16,
        opacity: metrics.scrollable ? 1 : 0,
        pointerEvents: metrics.scrollable ? "auto" : "none",
        transition: "opacity 0.2s",
      }}
      aria-hidden
    >
      {/* Track — always visible */}
      <div
        style={{
          position: "absolute",
          top: 8,
          bottom: 8,
          left: 6,
          width: 3,
          borderRadius: 9999,
          background: hovered ? "rgba(100,116,139,0.5)" : "rgba(100,116,139,0.3)",
          transition: "background 0.15s",
        }}
      />

      {/* User message markers — solid blue dots */}
      {metrics.markers.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 4,
            top: Math.max(8, pos - 5),
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#3b82f6",
            boxShadow: "0 0 0 2px rgba(59,130,246,0.3)",
            zIndex: 2,
          }}
          title="Your message"
        />
      ))}

      {/* Thumb — always visible, brighter on hover */}
      <div
        onMouseDown={handleThumbMouseDown}
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 5,
          top: metrics.thumbTop,
          width: 5,
          height: metrics.thumbHeight,
          borderRadius: 9999,
          background: hovered ? "rgba(100,116,139,0.95)" : "rgba(100,116,139,0.65)",
          transition: "background 0.15s",
          cursor: "grab",
          zIndex: 3,
        }}
      />
    </div>
  );
}
