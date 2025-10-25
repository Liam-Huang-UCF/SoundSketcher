"use client";

import React from "react";

const MusicNoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-12v13c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
  </svg>
);

export default function Header() {
  return (
    <header className="text-center mb-6">
      <div className="flex items-center justify-center gap-4">
        <MusicNoteIcon />
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
          SoundAnalyzer
        </h1>
      </div>
      <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
        Upload a music file or provide a link to get an AI-powered breakdown of its musical DNA.
      </p>
    </header>
  );
}
