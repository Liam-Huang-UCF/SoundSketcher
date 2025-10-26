# SoundSketch

SoundSketch is a lightweight web UI for exploring and analyzing music files. It provides two main pages:

- `/` (home) — landing UI and navigation
- `/SoundAnalyzer` — upload a file or paste a link (YouTube) to get a quick musical analysis and a waveform/preview
- `/SheetSketcher` — tools to convert or sketch sheet music from audio or uploads (UI-first work in progress)

This project is built with Next.js (App Router) and TypeScript and includes a small server-side AI wrapper that can call a hosted model (Gemini/GenAI) when configured, with a safe mock fallback for local development.

## Key features

- Upload audio files (mp3, wav) or paste links (YouTube) and get a model-backed musical analysis
- Interactive waveform preview (WaveSurfer) for uploaded audio files and embedded YouTube previews for links
- Server routes to accept file uploads (`/api/analyze-file`) and link analysis (`/api/analyze`)
- Optional Python-based feature extractor (librosa) if you need deep audio analysis; if Python is not available the server falls back to a lightweight Node extractor
- TypeScript-first codebase with runtime guards to keep client/server boundaries safe

## Architecture & important files

- `src/app/SoundAnalyzer` — UI and components for the SoundAnalyzer page
	- `components/InputArea.tsx` — drag/drop or paste input
	- `components/VisualPreview.tsx` — WaveSurfer waveform or YouTube iframe
	- `services/geminiService.ts` — server-side wrapper that builds prompts and calls the AI SDK (mock fallback when no API key/SDK)
- `src/app/api/analyze/route.ts` — POST endpoint for link analysis
- `src/app/api/analyze-file/route.ts` — POST endpoint that accepts multipart/form-data uploads and runs feature extraction
- `scripts/extract_features.py` — optional Python extractor (librosa) used when installed and `python` is available

## How analysis works (short)

1. Client uploads a file (FormData `file`) to `/api/analyze-file` or posts JSON `{ inputType, value }` to `/api/analyze` for links.
2. The server will attempt to extract features:
	 - If `scripts/extract_features.py` exists and `python` is on PATH, the server will run it and parse its JSON output.
	 - If Python is not available, the server runs a lightweight Node extractor (`music-metadata` optional) to read duration/bitrate/title/artist and passes that to the AI.
3. The server calls `analyzeWithFeatures(...)` which either uses the GenAI/Gemini SDK (if `GENAI_API_KEY` is set and SDK is available) or returns a deterministic mock response for development.

## Environment variables

Set these in your local environment when running the app:

- `NEXT_PUBLIC_...` — any public environment variables you need in the client
- `GENAI_API_KEY` — (optional) API key for the GenAI/Gemini SDK. If omitted, the server returns mock analyses.
- `MAX_UPLOAD_BYTES` — (optional) maximum upload size in bytes allowed by the server route. Defaults to `10485760` (10 MB).

## Optional dependencies

- `music-metadata` (npm) — used by the Node extractor to read mp3/wav metadata and duration. The code dynamically imports it if present; installing it gives richer metadata without Python.
- Python + `librosa` (and dependencies) — if you want tempo/key/chroma extraction, install Python and the `scripts/extract_features.py` dependencies (librosa, numpy, soundfile). The server will run the script when available.

## Local development

1. Install dependencies:

```powershell
npm install
```

2. (Optional) Install `music-metadata` for better Node extraction:

```powershell
# from project root
npm install music-metadata
```

3. (Optional) Prepare Python extractor (if you want full-feature extraction):

 - Install Python (ensure `python --version` works in the same shell used to run the dev server)
 - Install extractor deps (example):

```powershell
# create and activate a venv, then
pip install librosa numpy soundfile
```

4. Run the dev server:

```powershell
npm run dev
```

5. Open http://localhost:3000 and try uploading a short sample first. Watch the server logs for upload size messages printed by the API route.

## Troubleshooting

- "Error: spawn python ENOENT" — Python is not in PATH. Either install Python or rely on the Node extractor / install `music-metadata`.
- "Uploaded file is too large" or 413 responses — increase `MAX_UPLOAD_BYTES` locally or trim the audio before uploading (client-side trimming or upload only a short sample). For production, consider streaming to object storage instead of direct upload.
- AI responses look like mock data — this happens when `GENAI_API_KEY` is not set or the GenAI SDK is not installed on the server. Set `GENAI_API_KEY` and ensure `@google/genai` (or your chosen SDK) is available on the server to get real model outputs.

## Tests / checks

- Type-checking:

```powershell
npx tsc --noEmit
```

- Linting:

```powershell
npm run lint
```

## Next steps / ideas

- Add client-side trimming (upload first N seconds) to avoid large uploads
- Add richer Node-based audio analysis or containerized Python worker for robust feature extraction
- Improve schema validation and add automated tests for the API routes

## Contributing

Feel free to open issues or PRs. If you add heavy native deps (audio DSP), prefer keeping them optional and documented so local development stays lightweight.

---
If you'd like, I can also add a short "Getting analysis" section to the UI that explains why an analysis may be mock/limited (Python missing, file too large, GENAI key missing). 
