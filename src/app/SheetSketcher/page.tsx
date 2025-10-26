"use client";

import React, { useCallback, useMemo, useState } from "react";
// Link was removed in favor of Header component
import Header from "./components/Header";
import UploadArea from "./components/UploadArea";
import UploadedFiles from "./components/UploadedFiles";
import PreviewPanel from "./components/PreviewPanel";
import type { UploadedFile, JobStatus } from "./components/types";

export default function SheetSketcherPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Use NEXT_PUBLIC_* variable directly so this client component does not import
  // a server-only module. Next.js replaces NEXT_PUBLIC_* at build time for client code.
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_PY_API_URL ?? "http://localhost:8000", []);

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

  // UploadArea handles drag/drop and file selection; no local handlers required

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
  const parsedData: unknown = await res.json();
  if (typeof parsedData !== 'object' || parsedData === null) throw new Error('Invalid response from server');
  const data = parsedData as { job_id: string; status: string; message: string };

      setSelectedId(f.id);
      setMessage(`Job started. Tracking status for ${f.name}...`);

      pollStatus(f.id, data.job_id);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`Error: ${msg}`);
    }
  };

  const pollStatus = (clientFileId: string, jobId: string) => {
    const interval = setInterval(() => {
      void (async () => {
        try {
          const r = await fetch(`${API_BASE}/api/status/${jobId}`);
          if (!r.ok) throw new Error(`Status ${r.status}`);
          const parsed: unknown = await r.json();
          if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid status response');
          const js = parsed as JobStatus;

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
        } catch (err: unknown) {
          console.warn("Polling error", err);
        }
      })();
    }, 1500);
  };

  const downloadUrl = (
    jobId: string,
    kind: "musicxml" | "midi",
    instrument = "audio",
  ) => `${API_BASE}/api/download/${jobId}/${kind}/${instrument}`;

  return (
    <main>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Header />

        <section className="grid gap-8 md:grid-cols-2 min-h-[calc(100vh-6rem)]">
          {/* Left: upload + file list */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div>
              <UploadArea onFiles={onFiles} />

              <div className="mt-6">
                <UploadedFiles files={files} selectedId={selectedId} requestConvert={requestConvert} downloadUrl={downloadUrl} onSelect={(id) => setSelectedId(id)} />
              </div>
            </div>
          </div>

          {/* Right: preview (sticky) */}
          <aside className="md:col-span-1">
            <div className="sticky top-20 rounded-xl bg-white/3 p-6">
              <PreviewPanel files={files} selectedId={selectedId} message={message} downloadUrl={downloadUrl} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
