import { NextResponse } from "next/server";
import { analyzeMusic } from "../../SoundAnalyzer/services/geminiService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputType, value } = body as { inputType?: string; value?: string };
    if (!inputType || !value) {
      return NextResponse.json({ error: "Missing inputType or value" }, { status: 400 });
    }

    const analysis = await analyzeMusic(inputType as "file" | "link", String(value));
    return NextResponse.json(analysis);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("/api/analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
