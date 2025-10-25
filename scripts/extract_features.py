#!/usr/bin/env python3
"""
Simple feature extractor using librosa.
This script takes a single audio file path argument and prints JSON features to stdout.

Requirements (install into a python env):
  pip install librosa soundfile numpy

Usage:
  python scripts/extract_features.py /path/to/file.wav
"""
import sys
import json
import librosa

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing file"}))
        sys.exit(1)

    path = sys.argv[1]
    try:
        y, sr = librosa.load(path, sr=None, mono=True)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr).mean(axis=1).tolist()
        duration = librosa.get_duration(y=y, sr=sr)

        out = {
            "tempo": float(tempo),
            "duration": float(duration),
            "beats_count": int(len(beats)),
            "chroma_mean": chroma,
            "filename": path.split('/')[-1]
        }
        print(json.dumps(out))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
