"use client";

import React, { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (f: File | null) => void;
  disabled?: boolean;
  /** Optional: higher-level analyze handler (inputType, value) */
  onAnalyze?: (inputType: "file" | "link", value: File | string) => void;
};

export default function InputArea({ onFile, disabled, onAnalyze }: Props) {
  const [inputType, setInputType] = useState<"file" | "link">("file");
  const [linkValue, setLinkValue] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      setSelectedFile(f);
      setFileName(f ? f.name : "");
      // keep existing behavior: notify parent immediately
      onFile(f);
    },
    [onFile]
  );

  const handleDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0] ?? null;
      if (f) {
        setSelectedFile(f);
        setFileName(f.name);
        onFile(f);
      }
    },
    [onFile]
  );

  const handleDragOver: React.DragEventHandler = useCallback((e) => e.preventDefault(), []);

  const handleAnalyzeClick = useCallback(() => {
    if (disabled) return;
    if (inputType === "file") {
      if (onAnalyze) {
        if (selectedFile) onAnalyze("file", selectedFile);
      } else {
        // fallback: call onFile (already called on selection) but ensure parent can re-run
        if (selectedFile) onFile(selectedFile);
      }
    } else {
      if (onAnalyze) {
        onAnalyze("link", linkValue);
      } else {
        // no analyze handler: do nothing, but could call onFile(null)
      }
    }
  }, [disabled, inputType, onAnalyze, selectedFile, onFile, linkValue]);

  const isAnalyzeDisabled =
    disabled || (inputType === "file" && !selectedFile) || (inputType === "link" && !linkValue.trim());

  return (
    <div className="rounded-xl bg-white/3 p-6">
      <h3 className="mb-4 text-lg font-semibold">Upload audio</h3>
      <p className="mb-4 text-sm text-slate-300">
        Drop an audio file or select from your device. This UI simulates an AI
        analysis and displays a friendly summary.
      </p>
      <div className="flex border-b border-slate-700 mb-6">
        <TabButton active={inputType === "file"} onClick={() => setInputType("file")}>
          Upload File
        </TabButton>
        <TabButton active={inputType === "link"} onClick={() => setInputType("link")}>
          Use Link
        </TabButton>
      </div>

      <div className="space-y-4">
        {inputType === "file" && (
          <div
            className="flex items-center justify-center w-full p-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-white/2 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="audio/*"
              disabled={disabled}
            />
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-slate-300">
                <span className="font-semibold text-[hsl(200,100%,60%)]">Click to upload</span> or drag and drop
              </p>
              {fileName && <p className="mt-2 text-xs text-slate-200">{fileName}</p>}
            </div>
          </div>
        )}

        {inputType === "link" && (
          <input
            type="text"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="Paste YouTube link here"
            className="w-full px-4 py-3 bg-transparent border border-slate-600 rounded-lg focus:ring-2 focus:ring-[hsl(200,100%,60%)] focus:border-[hsl(200,100%,60%)] outline-none transition"
          />
        )}

        <button
          onClick={handleAnalyzeClick}
          disabled={isAnalyzeDisabled}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform
            ${isAnalyzeDisabled
              ? "bg-slate-600 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[hsl(200,100%,60%)] to-teal-600 text-white hover:from-[hsl(200,100%,60%)] hover:to-teal-500 active:scale-[0.98]"
            }`}
        >
          {disabled ? "Analyzing..." : "Analyze Music"}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 -mb-px font-medium text-sm border-b-2 transition-colors duration-200
                ${active ? "border-[hsl(200,100%,60%)] text-[hsl(200,100%,60%)]" : "border-transparent text-slate-400 hover:text-slate-200"}`}
    >
      {children}
    </button>
  );
};
