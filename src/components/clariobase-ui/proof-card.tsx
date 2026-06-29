type ProofCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function ProofCard({ children, className = "" }: ProofCardProps) {
  return (
    <section
      className={[
        "rounded-[var(--cb-ui-radius-lg)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      ].join(" ")}
    >
      {children}
    </section>
  );
}
