"use client";

import React, { useCallback, useState } from "react";
import Header from "./components/Header";
import InputArea from "./components/InputArea";
import AnalysisDisplay from "./components/AnalysisDisplay";
import LoadingSpinner from "./components/LoadingSpinner";
import VisualPreview from "./components/VisualPreview";
import type { AnalysisResult } from "./types";

export default function SoundAnalyzerPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (inputType: "file" | "link", value: File | string) => {
    // Validate
    if ((typeof value === "string" && !value.trim()) || !value) {
      setError("Please provide a file or a link to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    let analysisValue: string;
    if (inputType === "file" && value instanceof File) {
      setSelectedFile(value);
      setVideoUrl(null);
      analysisValue = value.name;
    } else {
      setSelectedFile(null);
      // If a YouTube link was provided, convert to an embed URL for preview
      const link = typeof value === 'string' ? value : '';
      analysisValue = link;
      const re = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;
      const match = re.exec(link);
      if (match?.[1]) {
        const id = match[1];
        setVideoUrl(`https://www.youtube.com/embed/${id}`);
      } else {
        setVideoUrl(null);
      }
    }

    try {
  let result: unknown;
      if (inputType === "file" && value instanceof File) {
        // Upload file to server route that accepts multipart/form-data
        const fd = new FormData();
        fd.append("file", value);
        const res = await fetch("/api/analyze-file", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());
        result = await res.json();
      } else {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputType, value: analysisValue }),
        });
        if (!res.ok) throw new Error(await res.text());
        result = await res.json();
      }
      // Basic runtime validation before updating state
      if (isAnalysisResult(result)) {
        setAnalysis(result);
      } else {
        console.error('Unexpected analysis shape', result);
        setError('Received unexpected analysis response');
      }
    } catch (e) {
      // Network or parsing error
      console.error(e);
      setError("Failed to analyze the music. Please check your input and try again.");
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function isAnalysisResult(obj: unknown): obj is AnalysisResult {
    if (typeof obj !== 'object' || obj === null) return false;
    const o = obj as Record<string, unknown>;
    return typeof o.songTitle === 'string' && typeof o.artist === 'string';
  }

  return (
    <main>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Header />

        <section className="grid gap-8 md:grid-cols-2 min-h-[calc(100vh-6rem)]">
          {/* Left: input + visual preview */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div>
              <InputArea onAnalyze={handleAnalyze} disabled={isLoading} onFile={(f) => { /* keep compatibility */ setSelectedFile(f); }} />

              {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div>
              <VisualPreview file={selectedFile} videoUrl={videoUrl} shouldPlay={!!analysis} />
            </div>
          </div>

          {/* Right: analysis output (sticky) */}
          <aside className="md:col-span-1">
            <div className="sticky top-20">
              {isLoading && <LoadingSpinner />}

              {analysis && !isLoading && <AnalysisDisplay analysis={analysis} />}

              {!analysis && !isLoading && !error && (
                <div className="text-sm text-slate-400">Upload a file or paste a link to begin analysis.</div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
