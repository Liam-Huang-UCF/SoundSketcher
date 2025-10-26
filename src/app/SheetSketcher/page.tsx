"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { env } from "~/env";

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  job?: JobStatus;
};

type JobFileInfo = { instrument: string; path: string };
type JobStatus = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
  created_at: string;
  completed_at?: string | null;
  musicxml_files: JobFileInfo[];
  midi_files: JobFileInfo[];
  errors: string[];
};

export default function SheetSketcherPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const API_BASE = useMemo(() => env.NEXT_PUBLIC_PY_API_URL ?? "http://localhost:8000", []);

  const onFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).map((f, idx) => ({
      id: `${crypto.randomUUID()}-${idx}`,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));
    setFiles((s: UploadedFile[]) => [...arr, ...s]);
    setMessage(null);
  }, []);

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };
  const onDragOver: React.DragEventHandler = (e) => {
    e.preventDefault();
  };

  const requestConvert = async (f: UploadedFile) => {
    try {
      setMessage(`Uploading "${f.name}" and starting conversion...`);

      const form = new FormData();
      form.append("file", f.file);

      const res = await fetch(`${API_BASE}/api/convert`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Upload failed with ${res.status}`);
      }
      const data: { job_id: string; status: string; message: string } = await res.json();

      setSelectedId(f.id);
      setMessage(`Job started. Tracking status for ${f.name}...`);

      pollStatus(f.id, data.job_id);
    } catch (e: any) {
      console.error(e);
      setMessage(`Error: ${e.message ?? e}`);
    }
  };

  const pollStatus = (clientFileId: string, jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/status/${jobId}`);
        if (!r.ok) throw new Error(`Status ${r.status}`);
        const js: JobStatus = await r.json();

        setFiles((prev: UploadedFile[]) =>
          prev.map((x: UploadedFile) => (x.id === clientFileId ? { ...x, job: js } : x)),
        );

        if (
          js.status === "completed" ||
          js.status === "completed_with_errors" ||
          js.status === "failed"
        ) {
          clearInterval(interval);
          setMessage(
            js.status === "failed"
              ? `Conversion failed: ${js.errors?.[0] ?? "Unknown error"}`
              : js.status === "completed_with_errors"
                ? `Completed with warnings. You can download the results.`
                : `Conversion complete. You can download the results.`,
          );
        }
      } catch (err) {
        console.warn("Polling error", err);
      }
    }, 1500);
  };

  const downloadUrl = (
    jobId: string,
    kind: "musicxml" | "midi",
    instrument = "audio",
  ) => `${API_BASE}/api/download/${jobId}/${kind}/${instrument}`;

  return (
    <main>
      <div className="container mx-auto px-6 py-12">
        <nav className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sheet Sketcher</h1>
          <Link href="/" className="text-sm text-slate-300 hover:underline">
            ← Home
          </Link>
        </nav>

        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
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

            <div className="mt-6">
              <h3 className="mb-2 text-lg font-semibold">Uploaded files</h3>
              <div className="flex max-h-60 flex-col gap-2 overflow-auto">
                {files.length === 0 && (
                  <div className="text-sm text-slate-400">No files yet.</div>
                )}
                {files.map((f) => (
                  <div
                    key={f.id}
                    className={`flex flex-col gap-2 rounded-md p-3 hover:bg-white/3 ${selectedId === f.id ? "ring-2 ring-[hsl(260,100%,70%)]" : ""
                      }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-slate-300">
                          {(f.size / 1024).toFixed(1)} KB • {f.type ?? "unknown"}
                        </div>
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
          </div>

          <aside className="rounded-xl bg-white/3 p-6">
            <h3 className="mb-4 text-xl font-semibold">Score preview</h3>
            {selectedId ? (
              <div>
                {(() => {
                  const f = files.find((x) => x.id === selectedId);
                  const jobId = f?.job?.job_id;
                  const isReady = f?.job && (f.job.status === "completed" || f.job.status === "completed_with_errors");
                  return isReady && jobId ? (
                    <div className="space-y-3">
                      <div className="rounded-md bg-gradient-to-b from-white/5 to-white/3 p-4 text-slate-100">
                        <p className="text-sm">
                          MusicXML is ready. For best results, open in MuseScore, Finale, or Dorico.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={downloadUrl(jobId, "musicxml")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10"
                        >
                          Open MusicXML
                        </a>
                        <a
                          href={downloadUrl(jobId, "midi")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10"
                        >
                          Download MIDI
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-200">
                      {f?.job ? `Status: ${f.job.status}. The score will be available here when ready.` : "Select a file and click Generate to start conversion."}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-slate-300">
                No preview yet — upload a file and click Generate.
              </div>
            )}

            {message && <div className="mt-4 text-sm text-slate-200">{message}</div>}
          </aside>
        </section>
      </div>
    </main>
  );
}
