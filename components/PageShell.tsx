import React from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "mint" | "coral" | "amber" | "teal";
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  badge,
  badgeColor = "mint",
  headerAction,
  children,
}: PageShellProps) {
  const badgeStyles = {
    mint:  "bg-[--color-mint-surface] text-[--color-accent] border-[--color-mint-border]",
    coral: "bg-[--color-coral-surface] text-[--color-status-low-accent] border-[--color-coral-border]",
    amber: "bg-[--color-amber-surface] text-[--color-status-high-accent] border-[--color-amber-border]",
    teal:  "bg-[--color-accent] text-white border-[--color-accent]",
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-14 py-9 sm:py-11 max-w-5xl w-full mx-auto animate-fadein">
      {/* ── Page Header ── */}
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {badge && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border mb-2.5 ${badgeStyles[badgeColor]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{badge}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[--color-text] leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm sm:text-[15px] text-[--color-text-secondary] leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0 self-start sm:self-center">
              {headerAction}
            </div>
          )}
        </div>
      </header>

      {/* ── Page Body ── */}
      {children}
    </main>
  );
}
