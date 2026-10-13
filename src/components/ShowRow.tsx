"use client";

import { useRef } from "react";

/** Horizontal, snap-scrolling row with arrow buttons that respect RTL. */
export default function ShowRow({
  title,
  labels,
  children,
}: {
  title: string;
  labels: { start: string; end: string };
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: direction * el.clientWidth * 0.85 * (rtl ? -1 : 1), behavior: "smooth" });
  }

  return (
    <section className="group/row relative mt-8">
      <h2 className="mb-3 px-4 text-lg font-bold sm:px-10 sm:text-xl">{title}</h2>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={labels.start}
          className="absolute inset-y-0 start-0 z-20 hidden w-10 items-center justify-center bg-black/50 text-3xl opacity-0 transition group-hover/row:opacity-100 sm:flex"
        >
          <span className="rtl:-scale-x-100">‹</span>
        </button>
        <div
          ref={ref}
          className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 py-3 sm:scroll-px-10 sm:px-10"
        >
          {children}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={labels.end}
          className="absolute inset-y-0 end-0 z-20 hidden w-10 items-center justify-center bg-black/50 text-3xl opacity-0 transition group-hover/row:opacity-100 sm:flex"
        >
          <span className="rtl:-scale-x-100">›</span>
        </button>
      </div>
    </section>
  );
}

export function RowItem({ children }: { children: React.ReactNode }) {
  return <div className="w-[62vw] shrink-0 snap-start sm:w-64 lg:w-72">{children}</div>;
}
