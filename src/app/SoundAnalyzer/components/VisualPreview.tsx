"use client";

import React, { useEffect, useRef, useState } from "react";

// Wavesurfer may be loaded globally (e.g. via a script tag). Tell TS about it.
declare const WaveSurfer: any;

type Props = {
  file?: File | null;
  /** Optional: embed a video (YouTube) instead of waveform when provided */
  videoUrl?: string | null;
  /** When true, VisualPreview will attempt to start playback when ready */
  shouldPlay?: boolean;
};

export default function VisualPreview({ file, videoUrl, shouldPlay }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    // If no file provided, ensure any existing instance is destroyed and show placeholder
    if (!file) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }

    if (!containerRef.current) return;

    // Async init so we can dynamic-import wavesurfer if needed
    let mounted = true;
    const init = async () => {
      // Destroy previous instance if present
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (e) {
          // ignore
        }
        wavesurferRef.current = null;
      }

      setIsLoading(true);

      // Import the Wavesurfer constructor (we installed wavesurfer.js as dependency)
      let WaveSurferCtor: any = null;
      try {
        const mod = await import("wavesurfer.js");
        WaveSurferCtor = (mod as any).default ?? mod;
      } catch (err) {
        console.warn("wavesurfer.js failed to load; falling back to static preview.", err);
        if (mounted) setIsLoading(false);
        return;
      }

      if (!mounted) return;

      const wavesurfer = WaveSurferCtor.create({
        container: containerRef.current,
        waveColor: "rgb(148 163 184)", // slate-400
        progressColor: "rgb(34 211 238)", // cyan-400
        height: 120,
        cursorWidth: 2,
        cursorColor: "rgb(165 243 252)",
        barWidth: 3,
        barRadius: 3,
        responsive: true,
        hideScrollbar: true,
      });

      const fileUrl = URL.createObjectURL(file as Blob);
      wavesurfer.load(fileUrl);
      wavesurferRef.current = wavesurfer;

      wavesurfer.on("ready", () => {
        if (!mounted) return;
        setIsLoading(false);
        URL.revokeObjectURL(fileUrl);
      });

      wavesurfer.on("play", () => setIsPlaying(true));
      wavesurfer.on("pause", () => setIsPlaying(false));
      wavesurfer.on("finish", () => setIsPlaying(false));
      // detect if autoplay was blocked: after short delay, if shouldPlay requested and not playing
      if (shouldPlay) {
        setTimeout(() => {
          if (!mounted) return;
          if (!wavesurfer.isPlaying?.()) {
            setAutoplayBlocked(true);
          }
        }, 600);
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        wavesurferRef.current?.destroy();
      } catch (e) {
        // ignore
      }
      wavesurferRef.current = null;
    };
  }, [file, videoUrl]);

  // If parent requests playback (e.g. analysis completed), start playback when possible
  useEffect(() => {
    if (!shouldPlay) return;
    const ws = wavesurferRef.current;
    if (!ws) return;
    try {
      // Attempt to play; browsers may block autoplay unless user interacted.
      if (typeof ws.play === "function") ws.play();
    } catch (e) {
      // ignore playback errors
    }
  }, [shouldPlay]);

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="rounded-xl bg-white/3 p-6">
      <h4 className="mb-3 text-sm font-semibold">Visual preview</h4>

      <div className="rounded-md bg-gradient-to-b from-white/5 to-white/3 p-3">
        {videoUrl ? (
          <div className="w-full">
            <iframe
              src={videoUrl}
              title="YouTube preview"
              className="w-full aspect-video rounded-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : file ? (
          <>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="flex-shrink-0 w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-cyan-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="w-full min-h-[120px]" ref={containerRef} />
            </div>
            {autoplayBlocked && (
              <div className="mt-2 text-sm text-yellow-300">Autoplay was blocked by your browser — click the play button to start audio.</div>
            )}
          </>
        ) : (
          // fallback static SVG waveform if no file provided
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
        )}
      </div>

      <div className="mt-4 text-sm text-slate-300">
        This pane shows a waveform preview. When a file is uploaded, an interactive
        waveform appears with playback controls (requires WaveSurfer to be loaded).
      </div>
    </div>
  );
}
