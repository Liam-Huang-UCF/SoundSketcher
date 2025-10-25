import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { analyzeWithFeatures } from "../../SoundAnalyzer/services/geminiService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Parse multipart/form-data using formidable
  const form = formidable({ multiples: false, maxFileSize: 50 * 1024 * 1024 });

  const { files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
  form.parse(request as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  const file = files.file as any;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Move the file to a tmp location (formidable may already give us a path)
  const tmpDir = os.tmpdir();
  const dest = path.join(tmpDir, path.basename(file.filepath || file.newFilename || file.originalFilename || 'upload'));
  try {
    await fs.promises.copyFile(file.filepath || file.filepath, dest);
  } catch (e) {
    // ignore copy error
  }

  // Try to run the Python feature extractor if available
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract_features.py');
    if (fs.existsSync(scriptPath)) {
      const out = await runPythonScript(scriptPath, dest);
      if (out && out.error) {
        console.warn('Feature extractor returned error', out.error);
      }
      // Merge features and call analyzeWithFeatures
      const analysis = await analyzeWithFeatures({ ...out, filename: path.basename(dest) });
      return NextResponse.json(analysis);
    } else {
      // Fallback: call analyzeWithFeatures with minimal info
      const analysis = await analyzeWithFeatures({ filename: path.basename(dest) });
      return NextResponse.json(analysis);
    }
  } catch (err) {
    console.error('/api/analyze-file error', err);
    return NextResponse.json({ error: 'File analysis failed' }, { status: 500 });
  } finally {
    // try to cleanup
    try { await fs.promises.unlink(dest); } catch (e) {}
  }
}

function runPythonScript(script: string, filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [script, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (d) => stdout += d.toString());
    py.stderr.on('data', (d) => stderr += d.toString());
    py.on('close', (code) => {
      if (code !== 0) {
        return resolve({ error: stderr || `python exit ${code}` });
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (e) {
        resolve({ error: 'invalid json from extractor', raw: stdout });
      }
    });
    py.on('error', (err) => resolve({ error: String(err) }));
  });
}
