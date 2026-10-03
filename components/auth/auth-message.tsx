import { Alert } from "@/components/ui/alert";

type AuthMessageProps = {
  variant: "success" | "error";
  title: string;
  children?: React.ReactNode;
};

/**
 * Auth-flow-specific success/error banner. A thin wrapper around the
 * generic `Alert` primitive used across every auth form.
 */
export function AuthMessage({ variant, title, children }: AuthMessageProps) {
  return (
    <Alert variant={variant} title={title}>
      {children}
    </Alert>
  );
}
