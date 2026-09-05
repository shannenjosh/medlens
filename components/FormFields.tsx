import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  hint?: string;
}

export function Label({ children, required, hint, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`block text-[13px] font-semibold text-[--color-text] mb-2 ${className}`}
      {...props}
    >
      <span>{children}</span>
      {required && (
        <span className="text-[--color-status-low-accent] font-bold ml-1" title="Required">
          *
        </span>
      )}
      {hint && (
        <span className="ml-2 text-xs font-normal text-[--color-muted]">
          {hint}
        </span>
      )}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`
        w-full px-4 py-3 text-sm bg-white border border-[--color-border] rounded-2xl text-[--color-text]
        placeholder:text-[--color-muted] hover:border-[--color-border-hover]
        focus:outline-none focus:border-[--color-accent] focus:ring-4 focus:ring-[--color-accent-ring]
        transition-all duration-200 shadow-2xs ${className}
      `}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`
        w-full px-4 py-3 text-sm bg-white border border-[--color-border] rounded-2xl text-[--color-text]
        placeholder:text-[--color-muted] hover:border-[--color-border-hover]
        focus:outline-none focus:border-[--color-accent] focus:ring-4 focus:ring-[--color-accent-ring]
        transition-all duration-200 resize-none shadow-2xs ${className}
      `}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`
          w-full px-4 py-3 pr-10 text-sm bg-white border border-[--color-border] rounded-2xl text-[--color-text]
          hover:border-[--color-border-hover]
          focus:outline-none focus:border-[--color-accent] focus:ring-4 focus:ring-[--color-accent-ring]
          transition-all duration-200 appearance-none cursor-pointer shadow-2xs ${className}
        `}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[--color-text-secondary]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

interface FieldGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FieldGroup({ children, className = "" }: FieldGroupProps) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}
