"use client";

import React from "react";

type Props = {
  onFiles: (incoming: FileList | null) => void;
};

export default function UploadArea({ onFiles }: Props) {
  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        onFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => e.preventDefault()}
      className="flex h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-600 bg-white/2 p-6 text-center transition hover:border-slate-400"
    >
      <div className="text-4xl">📥</div>
      <p className="text-lg font-medium">Drop MIDI or WAV here</p>
      <p className="text-sm text-slate-300">Or</p>
      <label className="cursor-pointer rounded-md bg-[hsl(260,100%,70%)]/20 px-4 py-2 text-sm text-[hsl(260,100%,70%)] hover:bg-[hsl(260,100%,70%)]/30">
        Select file
        <input
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
          type="file"
          accept="audio/*,.mid,.midi"
        />
      </label>
    </div>
  );
}
