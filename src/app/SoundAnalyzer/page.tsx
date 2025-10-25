"use client";

import { useState } from "react";
import Link from "next/link";

export default function SoundAnalyzer() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f?.name ?? null);

    if (f) {
      // fake analysis placeholder
      setAnalysis(
        `Key: C Major\nTempo: 120 BPM\nDetected instruments: Piano, Bass, Drums\nRhythmic patterns: 4/4 groove, syncopated hi-hat\nNotes of interest: motif at measures 8-12`
      );
    } else {
      setAnalysis(null);
    }
  }

  function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    alert("Analysis requested (UI-only). Connect API to enable processing.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#02121a] via-[#021218] to-[#00090b] text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto rounded-2xl bg-white/3 p-8 shadow-lg">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">SoundAnalyzer</h1>
              <p className="mt-1 text-slate-300">
                Upload a clip to receive a detailed breakdown of musical
                elements. This is a frontend mockup only.
              </p>
            </div>
            <Link href="/" className="text-sm text-slate-200 hover:underline">
              Back to Home
            </Link>
          </header>

          <form onSubmit={onAnalyze} className="mt-6 grid gap-6">
            <label className="block">
              <span className="text-sm text-slate-200">Select file or clip</span>
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
                className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-2 font-semibold text-black disabled:opacity-40"
              >
                Analyze
              </button>

              <div className="text-sm text-slate-300">
                {fileName ? `Selected: ${fileName}` : "No file selected"}
              </div>
            </div>

            <section className="mt-4 rounded-lg bg-black/40 p-4">
              <h2 className="text-lg font-semibold">Analysis Result</h2>
              <div className="mt-2 min-h-[160px] text-sm text-slate-300">
                {analysis ? (
                  <pre className="whitespace-pre-wrap">{analysis}</pre>
                ) : (
                  <div className="text-slate-500">Upload a file to see analysis.</div>
                )}
              </div>
            </section>

            <section className="mt-4 rounded-lg bg-black/30 p-4">
              <h3 className="text-md font-semibold">What we analyze</h3>
              <ul className="mt-2 list-inside list-disc text-slate-300">
                <li>Key and scale</li>
                <li>Tempo and time signature</li>
                <li>Instrument detection and timbre</li>
                <li>Rhythmic motifs and notable patterns</li>
                <li>Suggested practice sections</li>
              </ul>
            </section>
          </form>
        </div>
      </div>
    </main>
  );
}
