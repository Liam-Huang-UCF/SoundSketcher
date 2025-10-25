"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string; icon: (props: { className?: string }) => React.ReactElement };

const NAV: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 21V12h14v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "SheetSketcher",
    href: "/SheetSketcher",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6 8h12M6 12h10M6 16h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "SoundAnalyzer",
    href: "/SoundAnalyzer",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M2 12h3l2 4 3-8 2 4 3-6 2 12 3-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-4 right-4 z-30 flex items-center gap-3 rounded-xl bg-white/4 backdrop-blur-md px-3 py-2"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-md px-3 py-1 text-sm transition-colors ${
              active ? "font-semibold" : "text-slate-200"
            }`}
            aria-current={active ? "page" : undefined}
            style={active ? { borderBottom: '2px solid hsl(var(--accent))', color: 'hsl(var(--accent))' } : {}}
          >
            {item.icon({ className: 'h-4 w-4' })}
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
