"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const NOTE_TYPES = ["eighth", "beamed", "quarter", "flat", "sharp", "half"] as const;

// Map note type to filenames placed in the public/ folder (URL-encoded spaces)
const NOTE_FILE_MAP: Record<NoteSpec['typeKey'], string> = {
  eighth: '/Eighth%20Note.svg',
  beamed: '/Beamed%20Sixteenth%20Note.svg',
  quarter: '/Quarter%20Note.svg',
  flat: '/Flat.svg',
  sharp: '/Sharp.svg',
  half: '/Half%20Note.svg',
};

function getSizePx(sizeClass: NoteSpec['sizeClass']): number {
  switch (sizeClass) {
    case 'note-sm':
      return 18;
    case 'note-md':
      return 30;
    case 'note-lg':
      return 44;
    default:
      return 30;
  }
}

function renderNoteImage(typeKey: NoteSpec['typeKey'], sizeClass: NoteSpec['sizeClass']) {
  const src = NOTE_FILE_MAP[typeKey];
  const size = getSizePx(sizeClass);
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ display: "block", objectFit: "contain" }}
      priority={false}
    />
  );
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
  const typeKey = NOTE_TYPES[i % NOTE_TYPES.length]!;
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
          {renderNoteImage(n.typeKey, n.sizeClass)}
        </span>
      ))}
    </div>
  );
}
