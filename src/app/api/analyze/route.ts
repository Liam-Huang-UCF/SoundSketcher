import { NextResponse } from "next/server";
import { analyzeMusic } from "../../SoundAnalyzer/services/geminiService";

type AnalyzeRequest = { inputType?: unknown; value?: unknown };

function isString(x: unknown): x is string {
  return typeof x === "string";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const inputType = isString(body.inputType) ? body.inputType : undefined;
    const value = isString(body.value) ? body.value : undefined;

    if (!inputType || !value) {
      return NextResponse.json({ error: "Missing inputType or value" }, { status: 400 });
    }

    const analysis = await analyzeMusic(inputType as "file" | "link", value);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("/api/analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
