import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/types/place";
import type { Difficulty } from "@/types/place";

const DIFFICULTY_CLASSES: Record<Difficulty, string> = {
  easy: "bg-[#e6f4ea] text-[#1e7a3a]",
  moderate: "bg-[#fdf1d6] text-[#9a6a00]",
  hard: "bg-[#fbe1e8] text-[#b3164c]",
};

type DifficultyBadgeProps = {
  difficulty: Difficulty;
  className?: string;
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        DIFFICULTY_CLASSES[difficulty],
        className,
      )}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}
