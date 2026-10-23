"use client";

import { useState } from "react";
import { FormError } from "@/components/ui/form-error";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = {
  /** May resolve with an error message; the text is then kept so nothing is lost. */
  onSend: (content: string) => void | Promise<string | undefined>;
};

/** Message composer: Enter sends, Shift+Enter inserts a newline — the
 * conventional chat pattern, layered on the existing `Textarea`
 * primitive rather than a new input component. */
export function ChatComposer({ onSend }: ChatComposerProps) {
  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState<string>();
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    setSendError(undefined);
    const error = await onSend(content);
    setSending(false);
    if (error) {
      setSendError(error);
      return;
    }
    setContent("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--outly-border)] bg-[var(--outly-night)]/90 p-3 sm:p-4">
      {sendError ? <FormError id="chat-send-error">{sendError}</FormError> : null}
      <div className="flex items-end gap-2">
      <div className="flex-1">
        <Textarea
          id="chat-composer"
          label="Message"
          hideLabel
          rows={1}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          className="!resize-none max-h-32 !rounded-[var(--radius-lg)]"
        />
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={!content.trim() || sending}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-all gradient-brand hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon name="arrow-right" className="h-4.5 w-4.5" />
      </button>
      </div>
    </div>
  );
}
