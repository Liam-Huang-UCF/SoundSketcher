import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { analyzeWithFeatures } from "../../SoundAnalyzer/services/geminiService";

export const runtime = "nodejs";

// lightweight UploadedFile shape removed (unused) to satisfy lint rules

export async function POST(request: Request) {
  // Use Web Fetch API FormData (available in Next.js request) to read uploaded file.
  const formData = await request.formData();
  const uploaded = formData.get('file');
  if (!uploaded) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Determine filename and write to a temp file
  const tmpDir = os.tmpdir();
  let filename = 'upload';
  let fileBuffer: Buffer | null = null;

  // uploaded may be a File (browser/File API) when sent from the client form
  if (uploaded instanceof File) {
    const ab = await uploaded.arrayBuffer();
    fileBuffer = Buffer.from(ab);
    filename = uploaded.name ?? filename;
  }

  if (!fileBuffer) {
    return NextResponse.json({ error: 'Uploaded file not supported' }, { status: 400 });
  }

  const safeName = path.basename(filename);
  const dest = path.join(tmpDir, safeName);
  try {
    await fs.promises.writeFile(dest, fileBuffer);
  } catch {
    // ignore write errors
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract_features.py');
    if (fs.existsSync(scriptPath)) {
      const out = await runPythonScript(scriptPath, dest);
      const outObj = out as Record<string, unknown> | undefined;
      if (outObj && typeof outObj.error === 'string') {
        console.warn('Feature extractor returned error', outObj.error);
      }
      const analysis = await analyzeWithFeatures({ ...(out as Record<string, unknown> | undefined), filename: path.basename(dest) });
      return NextResponse.json(analysis);
    } else {
      const analysis = await analyzeWithFeatures({ filename: path.basename(dest) });
      return NextResponse.json(analysis);
    }
  } catch (err) {
    console.error('/api/analyze-file error', err);
    return NextResponse.json({ error: 'File analysis failed' }, { status: 500 });
  } finally {
    try { await fs.promises.unlink(dest); } catch { /* ignore */ }
  }
}

function runPythonScript(script: string, filePath: string): Promise<Record<string, unknown> | { error: string; raw?: string }> {
  return new Promise((resolve) => {
  const py = spawn('python', [script, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  py.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
  py.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    py.on('close', (code) => {
      if (code !== 0) {
  return resolve({ error: stderr ?? `python exit ${code}` });
      }
      try {
        const parsed: unknown = JSON.parse(stdout);
        if (typeof parsed === 'object' && parsed !== null) {
          resolve(parsed as Record<string, unknown>);
        } else {
          resolve({ error: 'invalid json from extractor', raw: stdout });
        }
      } catch {
        resolve({ error: 'invalid json from extractor', raw: stdout });
      }
    });
    py.on('error', (err: unknown) => resolve({ error: String(err) }));
  });
}
