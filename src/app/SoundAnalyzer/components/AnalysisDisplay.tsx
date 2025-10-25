"use client";

import React from "react";
import type { AnalysisResult } from "../types";

type Props = { analysis: AnalysisResult };

export default function AnalysisDisplay({ analysis }: Props) {
  const analysisItems = [
    { label: "Genre", value: analysis.genre ?? "—", icon: <TagIcon /> },
    { label: "Tempo", value: `${analysis.tempoBPM ?? "—"} BPM`, icon: <TempoIcon /> },
    { label: "Key", value: analysis.keySignature ?? "—", icon: <KeyIcon /> },
    { label: "Time", value: analysis.timeSignature ?? "—", icon: <MeterIcon /> },
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-lg animate-fade-in">
      <div className="pb-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-cyan-400">Analysis</h2>
        <p className="text-sm text-gray-300">Quick musical summary computed from the uploaded audio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {analysisItems.map((item) => (
          <InfoCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <ListCard title="Mood" items={analysis.mood ?? []} icon={<InstrumentIcon />} />
        <ListCard title="Instruments" items={analysis.instruments ?? []} icon={<InstrumentIcon />} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <TextCard title="Rhythm" text={analysis.rhythm ?? "—"} icon={<RhythmIcon />} />
        <TextCard title="Structure" text={analysis.structure ?? "—"} icon={<TagIcon />} />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Notes</h3>
        <p className="text-gray-400 bg-gray-900/50 p-4 rounded-lg">
          This analysis is approximate. Use it as a starting point for editing or exporting a score.
        </p>
      </div>
    </div>
  );
}

const InfoCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col items-center text-center">
    <div className="text-cyan-400 mb-2">{icon}</div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

const ListCard: React.FC<{ title: string; items: string[]; icon: React.ReactNode }> = ({ title, items, icon }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg">
    <div className="flex items-center gap-3 mb-3">
      <div className="text-cyan-400">{icon}</div>
      <h3 className="text-md font-semibold text-gray-300">{title}</h3>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.length === 0 ? (
        <span className="text-sm text-gray-400">None detected</span>
      ) : (
        items.map((item, index) => (
          <span key={index} className="bg-gray-700 text-cyan-200 text-xs font-medium px-2.5 py-1 rounded-full">
            {item}
          </span>
        ))
      )}
    </div>
  </div>
);

const TextCard: React.FC<{ title: string; text: string; icon: React.ReactNode }> = ({ title, text, icon }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-cyan-400">{icon}</div>
      <h3 className="text-md font-semibold text-gray-300">{title}</h3>
    </div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const TempoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.4 15a8 8 0 11-16.8 0" />
  </svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a4 4 0 110 8H7a4 4 0 110-8h.5" />
  </svg>
);

const MeterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);

const TagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l10 10" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11V5a2 2 0 00-2-2h-6" />
  </svg>
);

const InstrumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8" />
  </svg>
);

const RhythmIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14" />
  </svg>
);
