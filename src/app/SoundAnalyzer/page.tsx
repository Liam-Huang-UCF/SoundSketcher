"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";

export default function SoundAnalyzerPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    setLoading(true);
    setAnalysis(null);
    // simulate analysis
    await new Promise((r) => setTimeout(r, 1000));
    setAnalysis({
      tempo: 120,
      estimatedBars: 32,
      instruments: ["Piano", "Violin"],
      key: "C Major",
      timeSignature: "4/4",
      notableRhythms: ["syncopation", "triplets"],
    });
    setLoading(false);
  };

  return (
    <main>
      <div className="container mx-auto px-6 py-12">
        <nav className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sound Analyzer</h1>
          <Link href="/" className="text-sm text-slate-300 hover:underline">
            ← Home
          </Link>
        </nav>

        <section className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-xl bg-white/3 p-6">
              <h3 className="mb-4 text-lg font-semibold">Upload audio</h3>
              <p className="mb-4 text-sm text-slate-300">
                Drop an audio file or select from your device. This UI simulates
                an AI analysis and displays a friendly summary.
              </p>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-md bg-[hsl(200,100%,60%)]/20 px-4 py-2 text-sm text-[hsl(200,100%,60%)] hover:bg-[hsl(200,100%,60%)]/30">
                  Select file
                  <input
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    type="file"
                    accept="audio/*"
                  />
                </label>

                <div className="text-sm text-slate-300">or drag & drop here</div>
              </div>

              <div className="mt-6">
                {fileName && (
                  <div className="flex items-center gap-4">
                    <div className="rounded-md bg-white/5 px-4 py-2">{fileName}</div>
                    <audio ref={audioRef} controls className="w-full" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-white/3 p-6">
              <h4 className="mb-2 text-sm font-semibold">Analysis output</h4>
              {loading && <div className="text-sm text-slate-300">Analyzing…</div>}

              {analysis && (
                <div className="grid gap-2 text-sm text-slate-200">
                  <div>Tempo: {analysis.tempo} BPM</div>
                  <div>Key: {analysis.key}</div>
                  <div>Time signature: {analysis.timeSignature}</div>
                  <div>Estimated bars: {analysis.estimatedBars}</div>
                  <div>Instruments: {analysis.instruments.join(", ")}</div>
                  <div>Notable rhythms: {analysis.notableRhythms.join(", ")}</div>
                </div>
              )}

              {!loading && !analysis && (
                <div className="text-sm text-slate-400">No analysis yet.</div>
              )}
            </div>
          </div>

          <aside className="rounded-xl bg-white/3 p-6">
            <h4 className="mb-3 text-sm font-semibold">Visual preview</h4>
            <div className="h-48 rounded-md bg-gradient-to-b from-white/5 to-white/3 p-3">
              {/* Simple waveform placeholder */}
              <svg viewBox="0 0 600 100" className="w-full h-full">
                <polyline
                  points="0,50 30,40 60,60 90,30 120,70 150,45 180,55 210,35 240,65 270,50 300,50 330,60 360,40 390,70 420,30 450,80 480,50 510,60 540,35 570,55 600,50"
                  fill="none"
                  stroke="#fff"
                  strokeOpacity={0.8}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="mt-4 text-sm text-slate-300">
              This pane shows a mock waveform and quick stats. Real analysis would
              display spectrograms, onset detection, and instrument separation.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
