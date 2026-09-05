"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  ArrowUp,
  LayoutGrid,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

interface NavGroup {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: "PATIENT",
    items: [
      { href: "/intake", label: "Profile", icon: User },
    ],
  },
  {
    label: "ANALYZE",
    items: [
      { href: "/upload", label: "Upload Report", icon: ArrowUp },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { href: "/records", label: "Health Records", icon: LayoutGrid },
      { href: "/summary", label: "AI Summary", icon: Sparkles },
    ],
  },
];

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Distinctive minimal logo mark in teal */}
      <div className="w-9 h-9 rounded-2xl bg-[#0F6857] text-white flex items-center justify-center shrink-0 shadow-xs">
        <div className="relative w-5 h-5 rounded-full border-[2px] border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="absolute -top-0.5 w-0.5 h-1 bg-white" />
          <span className="absolute -bottom-0.5 w-0.5 h-1 bg-white" />
          <span className="absolute -left-0.5 h-0.5 w-1 bg-white" />
          <span className="absolute -right-0.5 h-0.5 w-1 bg-white" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[17px] font-extrabold text-[#142521] tracking-tight leading-none">
            Med<span className="text-[#0F6857]">Lens</span>
          </span>
        </div>
        <span className="text-[11px] text-[#426058] font-medium mt-1 leading-none">
          Health records, simplified
        </span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile Header ── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-[#E8F4EE] border-b border-[#D3E8DE]">
        <Link href="/intake" onClick={() => setMobileOpen(false)}>
          <BrandLogo />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="p-2 rounded-xl text-[#2F4A42] hover:text-[#0F6857] hover:bg-[#D7EDE2] transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[61px] bottom-0 z-20 bg-black/25 backdrop-blur-[2px] animate-fadein-flat">
          <div className="bg-[#E8F4EE] border-b border-[#D3E8DE] px-4 py-4 shadow-md flex flex-col gap-4">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <span className="px-3 text-[10px] font-bold text-[#426058] tracking-wider uppercase">
                  {group.label}
                </span>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold
                        transition-all duration-150
                        ${active
                          ? "bg-[#0F6857] text-white shadow-xs"
                          : "text-[#24433B] hover:bg-[#D7EDE2] hover:text-[#0F6857]"
                        }
                      `}
                    >
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.5 : 2}
                        className={`shrink-0 ${
                          active ? "text-white" : "text-[#426058]"
                        }`}
                      />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar: Light Mint Background (#E8F4EE) ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col min-h-screen bg-[#E8F4EE] border-r border-[#D3E8DE]">
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-6 border-b border-[#D3E8DE]">
          <Link href="/intake" className="inline-block">
            <BrandLogo />
          </Link>
        </div>

        {/* Categorized Nav Groups */}
        <nav className="flex flex-col gap-6 px-4 py-6 flex-1">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <span className="px-3 mb-1 text-[10px] font-bold text-[#426058] tracking-widest uppercase">
                {group.label}
              </span>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium
                      transition-all duration-150
                      ${active
                        ? "bg-[#0F6857] text-white font-bold shadow-xs"
                        : "text-[#24433B] hover:bg-[#D7EDE2] hover:text-[#0F6857]"
                      }
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.4 : 1.9}
                      className={`shrink-0 ${
                        active ? "text-white" : "text-[#426058]"
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Card: Flat Mint background reading "Your health. Clearly organised." */}
        <div className="p-4 mx-4 mb-5 rounded-2xl bg-[#DBF0E7] border border-[#BFDFD1]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F6857]" />
            <span className="text-xs font-bold text-[#0F6857]">MedLens Active</span>
          </div>
          <p className="text-xs font-semibold text-[#142521] mt-1.5 leading-snug">
            Your health. Clearly organised.
          </p>
          <span className="inline-block mt-1 text-[10px] font-medium text-[#426058]">
            Patient Profile
          </span>
        </div>
      </aside>
    </>
  );
}
