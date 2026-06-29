import type { ComponentProps } from "react";

type ProofCardProps = ComponentProps<"section"> & {
  elevated?: boolean;
};

export function ProofCard({ className = "", elevated = false, ...props }: ProofCardProps) {
  return (
    <section
      data-slot="card"
      className={[
        "rounded-lg border bg-[color:var(--cb-ui-card)] text-[color:var(--cb-ui-foreground)]",
        elevated ? "shadow-[0_8px_24px_rgba(15,23,42,0.08)]" : "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      ].join(" ")}
      {...props}
    />
  );
}

export function ProofCardHeader({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={["flex flex-col space-y-1.5 p-6", className].join(" ")} {...props} />;
}

export function ProofCardTitle({
  className = "",
  ...props
}: ComponentProps<"h2">) {
  return (
    <h2 data-slot="card-title" className={["font-semibold leading-none tracking-tight", className].join(" ")} {...props} />
  );
}

export function ProofCardDescription({ className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={["text-sm text-[color:var(--cb-ui-muted-foreground)]", className].join(" ")}
      {...props}
    />
  );
}

export function ProofCardContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={["p-6 pt-0", className].join(" ")} {...props} />;
}

export function ProofCardFooter({ className = "", ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={["flex items-center p-6 pt-0", className].join(" ")} {...props} />;
}
