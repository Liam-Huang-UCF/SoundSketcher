"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {

  return (
    <main>
      <div className="container px-6 py-16">
        <header className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
            SoundSketch
            <span className="ml-3 inline-block align-middle">
              <Image src="/logo.svg" alt="SoundSketch logo" width={48} height={48} priority={false} />
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-200">
            Upload audio or MIDI and instantly preview sheet music. Analyze
            rhythms, instruments, and tempo with an AI-powered breakdown — UI
            only (no API wired).
          </p>
        </header>

        <section className="mt-12 grid gap-8 sm:grid-cols-2">
          <Link
            href="/SheetSketcher"
            className="group flex flex-col gap-4 rounded-2xl border border-slate-700 bg-gradient-to-br from-white/3 to-white/2 p-6 transition hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Sheet Sketcher</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Upload MIDI or WAV to convert into readable sheet music.
                </p>
              </div>
              <div className="rounded-full bg-[hsl(260,100%,70%)]/20 p-3 text-[hsl(260,100%,70%)]">
                ♬
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Drag & drop a file, then preview the generated score and
              download a printable PDF (placeholder UI).
            </p>
            <div className="mt-2 text-xs text-slate-500">Go →</div>
          </Link>

          <Link
            href="/SoundAnalyzer"
            className="group flex flex-col gap-4 rounded-2xl border border-slate-700 bg-gradient-to-br from-white/3 to-white/2 p-6 transition hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Sound Analyzer</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Upload audio clips to get a breakdown of tempo, instruments,
                  and rhythms.
                </p>
              </div>
              <div className="rounded-full bg-[hsl(200,100%,60%)]/20 p-3 text-[hsl(200,100%,60%)]">
                ♪
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Visual waveform, tempo estimate, and instrument guesses (mock
              UI).
            </p>
            <div className="mt-2 text-xs text-slate-500">Explore →</div>
          </Link>
        </section>

        <section className="mt-12 mx-auto max-w-3xl rounded-2xl bg-white/3 p-6 text-slate-200">
          <h3 className="mb-3 text-xl font-semibold">How it works (UI-only)</h3>
          <ol className="ml-4 list-decimal text-sm text-slate-300">
            <li className="mb-1">Upload a MIDI or audio file.</li>
            <li className="mb-1">
              The app will prepare the file and send it to an API (placeholder).
            </li>
            <li className="mb-1">
              You receive sheet music or an analysis report (mock preview here).
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
