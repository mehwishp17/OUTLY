import { Alert } from "@/components/ui/alert";

type AuthMessageProps = {
  variant: "success" | "error";
  title: string;
  children?: React.ReactNode;
};

/**
 * Auth-flow-specific success/error banner. A thin wrapper around the
 * generic `Alert` primitive with copy conventions used across every
 * mocked auth form (e.g. always framing success as "(mocked)").
 */
export function AuthMessage({ variant, title, children }: AuthMessageProps) {
  return (
    <Alert variant={variant} title={title}>
      {children}
    </Alert>
  );
}
