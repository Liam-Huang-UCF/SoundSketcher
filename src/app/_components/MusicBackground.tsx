"use client";

import React, { useEffect, useState } from "react";

const NOTE_TYPES = ["eighth", "beamed", "quarter", "flat", "sharp", "half"] as const;

function getSizePx(sizeClass: NoteSpec['sizeClass']) {
  switch (sizeClass) {
    case 'note-sm':
      return 18;
    case 'note-md':
      return 30;
    case 'note-lg':
      return 44;
  }
}

function renderNoteSvg(typeKey: NoteSpec['typeKey'], sizeClass: NoteSpec['sizeClass']) {
  const size = getSizePx(sizeClass);
  const common = { width: size, height: size, viewBox: '0 0 64 64', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true } as any;

  switch (typeKey) {
    case 'quarter':
      return (
        <svg {...common}>
          <path d="M24 42c0 6.627 8 10 14 6 6-4 6-12 0-16-6-4-14-1.373-14 10z" fill="currentColor" />
          <rect x="36" y="6" width="3.6" height="36" rx="1.6" fill="currentColor" />
        </svg>
      );
    case 'eighth':
      return (
        <svg {...common}>
          <path d="M18 44c0 5.5 6.5 8.5 12 5.5s6-11-1-14C23 32 18 36.5 18 44z" fill="currentColor" />
          <rect x="30" y="10" width="3.4" height="34" rx="1.4" fill="currentColor" />
          <path d="M34 12c10-3 16-2 8 8" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'beamed':
      return (
        <svg {...common}>
          <path d="M14 46c0 5 6 8 11 5s6-10 0-14C25 34 14 38 14 46z" fill="currentColor" />
          <rect x="26" y="14" width="3.4" height="36" rx="1.4" fill="currentColor" />
          <path d="M34 18 L58 12 L58 20 L34 26 Z" fill="currentColor" opacity="0.95" />
        </svg>
      );
    case 'flat':
      return (
        <svg {...common}>
          <path d="M26 12v28c0 6 10 6 10 0V12c0-6-10-6-10 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M26 26c6-2 10 0 10 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'sharp':
      return (
        <svg {...common}>
          <path d="M20 18 L20 50 M44 14 L44 46" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M14 26 L50 22 M14 36 L50 32" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'half':
      return (
        <svg {...common}>
          <path d="M24 42c0 6 8 9 14 6s6-11 0-15-14-1-14 9z" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <rect x="36" y="6" width="3.4" height="36" rx="1.4" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

type NoteSpec = {
  left: number;
  sizeClass: "note-sm" | "note-md" | "note-lg";
  duration: string;
  delay: string;
  typeKey: (typeof NOTE_TYPES)[number];
  ghost: boolean;
};

export default function MusicBackground() {
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<NoteSpec[] | null>(null);

  useEffect(() => {
    // only generate randomized attributes on the client after mount to avoid
    // SSR/client hydration mismatches caused by Math.random/Date.now
    setMounted(true);
    const arr: NoteSpec[] = Array.from({ length: 12 }).map((_, i) => {
      const left = Math.round(Math.random() * 100);
      const sizeClass = i % 3 === 0 ? "note-lg" : i % 2 === 0 ? "note-md" : "note-sm";
      const duration = `${(10 + Math.random() * 18).toFixed(2)}s`;
      const delay = `${(-Math.random() * 8).toFixed(2)}s`;
  const typeKey = NOTE_TYPES[i % NOTE_TYPES.length] as (typeof NOTE_TYPES)[number];
      const ghost = Math.random() > 0.7;
      return { left, sizeClass, duration, delay, typeKey, ghost };
    });
    setNotes(arr);
  }, []);

  if (!mounted || !notes) return null;

  return (
    <div className="music-bg" aria-hidden>
      {notes.map((n, i) => (
        <span
          key={i}
          className={["music-note", n.sizeClass, n.ghost ? "note-ghost" : ""].join(" ").trim()}
          style={{ left: `${n.left}%`, animationDuration: n.duration, animationDelay: n.delay }}
        >
          {renderNoteSvg(n.typeKey, n.sizeClass)}
        </span>
      ))}
    </div>
  );
}
