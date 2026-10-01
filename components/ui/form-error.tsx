import { Icon } from "@/components/ui/icon";

type FormErrorProps = {
  id: string;
  children: React.ReactNode;
};

/**
 * Inline field validation message. Uses `role="alert"` so assistive
 * technology announces it as soon as it appears, and pairs the red text
 * with an icon so the error is never communicated by color alone.
 */
export function FormError({ id, children }: FormErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-[#B3164C]"
    >
      <Icon name="alert-circle" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
