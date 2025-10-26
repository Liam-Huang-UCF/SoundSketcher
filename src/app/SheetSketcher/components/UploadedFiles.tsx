"use client";

import React from "react";
import type { UploadedFile } from "./types";

type Props = {
  files: UploadedFile[];
  selectedId: string | null;
  requestConvert: (f: UploadedFile) => void;
  downloadUrl: (jobId: string, kind: "musicxml" | "midi", instrument?: string) => string;
  onSelect: (id: string) => void;
};

export default function UploadedFiles({ files, selectedId, requestConvert, downloadUrl, onSelect }: Props) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold">Uploaded files</h3>
      <div className="flex max-h-60 flex-col gap-2 overflow-auto">
        {files.length === 0 && <div className="text-sm text-slate-400">No files yet.</div>}
        {files.map((f) => (
          <div
            key={f.id}
            onClick={() => onSelect(f.id)}
            role="button"
            tabIndex={0}
            className={`cursor-pointer flex flex-col gap-2 rounded-md p-3 hover:bg-white/3 ${selectedId === f.id ? "ring-2 ring-[hsl(260,100%,70%)]" : ""}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-slate-300">{(f.size / 1024).toFixed(1)} KB • {f.type ?? "unknown"}</div>
                {f.job && (
                  <div className="text-xs text-slate-300 mt-1">
                    Status: <span className="font-medium text-slate-200">{f.job.status}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => requestConvert(f)}
                  className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10"
                >
                  {f.job && (f.job.status === "processing" || f.job.status === "queued")
                    ? "Processing..."
                    : f.job
                      ? "Re-run"
                      : "Generate"}
                </button>
                {f.job && (f.job.status === "completed" || f.job.status === "completed_with_errors") && (
                  <>
                    <a
                      href={f.job ? downloadUrl(f.job.job_id, "musicxml") : "#"}
                      className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download MusicXML
                    </a>
                    <a
                      href={f.job ? downloadUrl(f.job.job_id, "midi") : "#"}
                      className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download MIDI
                    </a>
                  </>
                )}
              </div>
            </div>
            {f.job?.errors && f.job.errors.length > 0 && (
              <div className="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-800/30">
                <div className="font-semibold mb-1">Error:</div>
                <div className="whitespace-pre-wrap font-mono text-[11px]">{f.job.errors[0]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
