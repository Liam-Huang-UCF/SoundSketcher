"use client";

import React from "react";
import type { UploadedFile } from "./types";

type Props = {
  files: UploadedFile[];
  selectedId: string | null;
  message: string | null;
  downloadUrl: (jobId: string, kind: "musicxml" | "midi", instrument?: string) => string;
};

export default function PreviewPanel({ files, selectedId, message, downloadUrl }: Props) {
  return (
    <div>
      <h3 className="mb-4 text-xl font-semibold">Score preview</h3>
      {selectedId ? (
        (() => {
          const f = files.find((x) => x.id === selectedId);
          const jobId = f?.job?.job_id;
          const isReady = f?.job && (f.job.status === "completed" || f.job.status === "completed_with_errors");
          if (isReady && jobId) {
            return (
              <div className="space-y-3">
                <div className="rounded-md bg-gradient-to-b from-white/5 to-white/3 p-4 text-slate-100">
                  <p className="text-sm">MusicXML is ready. For best results, open in MuseScore, Finale, or Dorico.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={downloadUrl(jobId, "musicxml")} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10">Open MusicXML</a>
                  <a href={downloadUrl(jobId, "midi")} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10">Download MIDI</a>
                </div>
              </div>
            );
          }
          return <div className="text-sm text-slate-200">{f?.job ? `Status: ${f.job.status}. The score will be available here when ready.` : "Select a file and click Generate to start conversion."}</div>;
        })()
      ) : (
        <div className="text-center text-slate-300">No preview yet — upload a file and click Generate.</div>
      )}

      {message && <div className="mt-4 text-sm text-slate-200">{message}</div>}
    </div>
  );
}
