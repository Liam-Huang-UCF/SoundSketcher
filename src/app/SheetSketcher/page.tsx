"use client";

import { useState } from "react";
import Link from "next/link";

export default function SheetSketcher() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notesPreview, setNotesPreview] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f?.name ?? null);
    // Generate a fake preview for UI demonstration
    if (f) {
      setNotesPreview("A4 B4 C5 D5 — (preview, connect API to show real sheet music)");
    } else {
      setNotesPreview(null);
    }
  }

  function onUpload(e: React.FormEvent) {
    e.preventDefault();
    // No API connection per instructions — just simulate
    alert("File submitted for processing (UI only). Connect API to enable.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#071026] to-[#031018] text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto rounded-2xl bg-white/3 p-8 shadow-lg">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">SheetSketcher</h1>
              <p className="mt-1 text-slate-300">
                Upload audio or MIDI and receive sheet music. This demo shows
                the frontend flow only.
              </p>
            </div>
            <Link href="/" className="text-sm text-slate-200 hover:underline">
              Back to Home
            </Link>
          </header>

          <form onSubmit={onUpload} className="mt-6 grid gap-6">
            <label className="block">
              <span className="text-sm text-slate-200">Select file</span>
              <input
                type="file"
                accept="audio/*, .mid, .midi"
                onChange={onFileChange}
                className="mt-2 w-full rounded-md bg-black/40 px-3 py-2 text-slate-100"
              />
            </label>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={!file}
                className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 px-6 py-2 font-semibold text-black disabled:opacity-40"
              >
                Upload & Convert
              </button>

              <div className="text-sm text-slate-300">
                {fileName ? `Selected: ${fileName}` : "No file selected"}
              </div>
            </div>

            <section className="mt-4 rounded-lg bg-black/40 p-4">
              <h2 className="text-lg font-semibold">Sheet Music Preview</h2>
              <div className="mt-2 min-h-[160px] flex items-center justify-center text-sm text-slate-300">
                {notesPreview ? (
                  <pre className="whitespace-pre-wrap text-center">{notesPreview}</pre>
                ) : (
                  <div className="text-center text-slate-500">Upload a file to see a preview.</div>
                )}
              </div>
            </section>

            <section className="mt-4 rounded-lg bg-black/30 p-4">
              <h3 className="text-md font-semibold">Export Options</h3>
              <p className="mt-2 text-slate-300 text-sm">PDF and MusicXML export will be available once connected to the backend.</p>
            </section>
          </form>
        </div>
      </div>
    </main>
  );
}
