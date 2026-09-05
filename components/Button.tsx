import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "coral" | "amber";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  success?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  success = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Flat colors only — hover lift translateY -2px, press-down animation on click
  const base =
    "inline-flex items-center justify-center gap-2.5 font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[--color-accent-ring] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";

  const variants = {
    primary:
      "bg-[--color-accent] text-white hover:bg-[--color-accent-hover] shadow-sm hover:shadow-md active:shadow-xs border border-transparent",
    secondary:
      "bg-[--color-accent-light] text-[--color-accent] hover:bg-[#D5EDE4] border border-[--color-accent-border] shadow-2xs hover:shadow-xs",
    outline:
      "bg-[--color-surface] text-[--color-text] border border-[--color-border] hover:border-[--color-border-hover] hover:bg-[--color-bg-subtle] shadow-2xs hover:shadow-xs",
    ghost:
      "text-[--color-text-secondary] hover:text-[--color-text] hover:bg-[--color-accent-light]",
    coral:
      "bg-[--color-status-low-accent] text-white hover:bg-[--color-status-low] shadow-sm hover:shadow-md active:shadow-xs border border-transparent",
    amber:
      "bg-[--color-status-high-accent] text-white hover:bg-[--color-status-high] shadow-sm hover:shadow-md active:shadow-xs border border-transparent",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs rounded-xl",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
    xl: "px-8 py-3.5 text-base rounded-2xl",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading || success}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0 text-current"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
