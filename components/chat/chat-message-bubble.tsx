import { Avatar } from "@/components/ui/avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  /** Show the sender's name above the bubble — used in group chats where
   * multiple people post, hidden in one-to-one chats. */
  showSenderName?: boolean;
};

export function ChatMessageBubble({ message, isMine, showSenderName }: ChatMessageBubbleProps) {
  return (
    <div className={cn("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
      {!isMine ? <Avatar name={message.senderName} avatarUrl={message.senderAvatarUrl} size="sm" /> : null}
      <div className={cn("flex max-w-[75%] flex-col gap-1", isMine ? "items-end" : "items-start")}>
        {showSenderName && !isMine ? (
          <span className="px-1 text-xs font-semibold text-[var(--outly-muted)]">
            {message.senderName}
          </span>
        ) : null}
        <div
          className={cn(
            "rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-soft)] transition-shadow duration-200",
            isMine
              ? "gradient-brand text-white rounded-br-[var(--radius-sm)]"
              : "border border-[var(--outly-border)] bg-white text-[var(--outly-ink)] rounded-bl-[var(--radius-sm)]",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="px-1 text-xs text-[var(--outly-muted)]">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
