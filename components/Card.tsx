import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  hoverable?: boolean;
  tint?: "none" | "mint" | "coral" | "amber";
}

export default function Card({
  children,
  className = "",
  elevated = false,
  hoverable = true,
  tint = "none",
}: CardProps) {
  const tintClasses = {
    none:  "bg-[--color-surface] border-[--color-border]",
    mint:  "bg-[--color-mint-surface] border-[--color-mint-border]",
    coral: "bg-[--color-coral-surface] border-[--color-coral-border]",
    amber: "bg-[--color-amber-surface] border-[--color-amber-border]",
  };

  return (
    <div
      className={`
        border rounded-[22px] p-6 sm:p-8 transition-all duration-200
        ${tintClasses[tint]}
        ${elevated
          ? "shadow-sm"
          : "shadow-2xs"
        }
        ${hoverable ? "hover:-translate-y-0.5 hover:shadow-md" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
