"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DropdownMenuItem = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

type DropdownMenuProps = {
  items: DropdownMenuItem[];
  triggerLabel: string;
  triggerIcon?: ReactNode;
  className?: string;
};

/**
 * Minimal accessible menu button (`aria-haspopup="menu"` /
 * `aria-expanded` pattern) used for the post-card "more actions" menu
 * (Edit / Delete). Closes on outside click, on Escape, or after an item
 * is selected, and returns focus to the trigger button on Escape.
 */
export function DropdownMenu({ items, triggerLabel, triggerIcon, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--outly-muted)] transition-colors hover:bg-[var(--outly-lavender)] hover:text-[var(--outly-violet)]"
      >
        {triggerIcon ?? (
          <span aria-hidden="true" className="text-lg leading-none">
            ⋯
          </span>
        )}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          className="absolute right-0 z-20 mt-2 w-44 origin-top-right overflow-hidden rounded-[var(--radius-md)] border border-[var(--outly-border)] bg-white py-1.5 shadow-[var(--shadow-elevated)] animate-scale-in motion-reduce:animate-none"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "block w-full px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-[var(--outly-lavender)]",
                item.destructive ? "text-[#B3164C]" : "text-[var(--outly-ink)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
