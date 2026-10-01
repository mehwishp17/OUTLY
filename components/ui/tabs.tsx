"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultTabId?: string;
  className?: string;
  ariaLabel?: string;
};

/**
 * Accessible tabs (single ARIA `tablist`/`tab`/`tabpanel` set) used on the
 * profile page for Activity history / Saved places / About. Supports
 * left/right arrow-key navigation between tabs per the WAI-ARIA tabs
 * pattern.
 */
export function Tabs({ items, defaultTabId, className, ariaLabel = "Sections" }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? items[0]?.id);
  const baseId = useId();
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    function measure() {
      const el = tabRefs.current.get(activeId);
      if (el) {
        setIndicator({ left: el.offsetLeft, top: el.offsetTop + el.offsetHeight - 2, width: el.offsetWidth });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeId, items]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = items[(index + 1) % items.length];
      setActiveId(next.id);
      document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previous = items[(index - 1 + items.length) % items.length];
      setActiveId(previous.id);
      document.getElementById(`${baseId}-tab-${previous.id}`)?.focus();
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="relative flex flex-wrap gap-1.5 border-b border-[var(--outly-border)]"
      >
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "-mb-px rounded-t-[var(--radius-sm)] border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none",
                selected
                  ? "text-[var(--outly-purple-dark)]"
                  : "text-[var(--outly-muted)] hover:text-[var(--outly-violet)]",
              )}
            >
              {item.label}
            </button>
          );
        })}
        {indicator ? (
          <span
            aria-hidden="true"
            className="absolute h-0.5 rounded-full bg-[var(--outly-violet)] transition-[left,width,top] duration-200 ease-out motion-reduce:transition-none"
            style={{ left: indicator.left, top: indicator.top, width: indicator.width }}
          />
        ) : null}
      </div>
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={`${baseId}-panel-${item.id}`}
            aria-labelledby={`${baseId}-tab-${item.id}`}
            hidden={!selected}
            className="pt-6"
          >
            {selected ? (
              <div key={activeId} className="animate-fade-in motion-reduce:animate-none">
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
