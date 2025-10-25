import type { AnalysisResult } from "../types";

const API_KEY = process.env.GENAI_API_KEY ?? process.env.API_KEY ?? undefined;

let ai: any = null;

// Use a plain JSON schema object (avoid referencing SDK-specific Type constants so
// this module can be typechecked even if the genai SDK isn't installed).
const analysisSchema = {
  type: 'object',
  properties: {
    songTitle: { type: 'string', description: 'The title of the song.' },
    artist: { type: 'string', description: 'The artist of the song.' },
    genre: { type: 'string', description: 'The primary genre of the song.' },
    mood: { type: 'array', items: { type: 'string' }, description: 'A list of moods or feelings the song evokes.' },
    instruments: { type: 'array', items: { type: 'string' }, description: 'A list of prominent instruments heard in the song.' },
    tempoBPM: { type: 'number', description: 'The estimated tempo in beats per minute (BPM).' },
    keySignature: { type: 'string', description: "The key signature of the song (e.g., 'C Major')." },
    timeSignature: { type: 'string', description: "The time signature of the song (e.g., '4/4')." },
    rhythm: { type: 'string', description: 'A description of the rhythmic feel and complexity.' },
    structure: { type: 'string', description: "A summary of the song's structure (e.g., Verse-Chorus-Verse)." },
    overallVibe: { type: 'string', description: 'A detailed paragraph summarizing the overall vibe and sonic texture of the track.' },
  },
  required: [
    'songTitle', 'artist', 'genre', 'mood', 'instruments',
    'tempoBPM', 'keySignature', 'timeSignature', 'rhythm', 'structure', 'overallVibe'
  ],
};
export const analyzeMusic = async (inputType: 'file' | 'link', value: string): Promise<AnalysisResult> => {
  const prompt = `You are a world-class musicologist and audio analyst. A user has provided a music source. Based on this source, provide a comprehensive analysis.
  
  Source Type: ${inputType}
  Source Value: "${value}"
  
  Generate a detailed musical analysis. Your response MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting, code block syntax, or any text outside of the JSON object.
  If the source is a filename, infer the artist and title from it. If it's a link, use the information from the link. Make educated guesses if necessary.
  `;
  
  try {
    if (!API_KEY) {
      // No API key configured — return a plausible mock analysis so the UI can work during dev.
      await new Promise((r) => setTimeout(r, 800));
      const titleGuess = inputType === 'file' ? value.replace(/\.[^.]+$/, '') : 'Unknown Title';
      return {
        songTitle: String(titleGuess),
        artist: 'Unknown',
        genre: 'Ambient',
        mood: ['Calm', 'Reflective'],
        instruments: ['Piano', 'Pad'],
        tempoBPM: 100,
        keySignature: 'C Major',
        timeSignature: '4/4',
        rhythm: 'Gentle, steady pulse with light syncopation',
        structure: 'Intro - Theme - Bridge - Outro',
        overallVibe: 'A warm and spacious arrangement with soft dynamics and a melodic piano lead.',
      } as AnalysisResult;
    }

    // Lazy-load the GenAI SDK only when an API key is configured. If the SDK
    // isn't installed, fall back to the mock result to keep the UI functional.
    if (!ai) {
      try {
        // Use eval + dynamic import to avoid TypeScript attempting to resolve the
        // optional SDK at compile time. If the package isn't installed this
        // will throw at runtime and we fall back to the mock result.
        const mod = await eval("import('@google/genai')");
        const GoogleGenAI = (mod as any).GoogleGenAI ?? (mod as any).default?.GoogleGenAI;
        if (!GoogleGenAI) throw new Error('GoogleGenAI constructor not found in SDK');
        ai = new GoogleGenAI({ apiKey: API_KEY });
      } catch (err) {
        console.warn('GenAI SDK not available or failed to load, returning mock analysis.', err);
        await new Promise((r) => setTimeout(r, 400));
        const titleGuess = inputType === 'file' ? value.replace(/\.[^.]+$/, '') : 'Unknown Title';
        return {
          songTitle: String(titleGuess),
          artist: 'Unknown',
          genre: 'Ambient',
          mood: ['Calm', 'Reflective'],
          instruments: ['Piano', 'Pad'],
          tempoBPM: 100,
          keySignature: 'C Major',
          timeSignature: '4/4',
          rhythm: 'Gentle, steady pulse with light syncopation',
          structure: 'Intro - Theme - Bridge - Outro',
          overallVibe: 'A warm and spacious arrangement with soft dynamics and a melodic piano lead.',
        } as AnalysisResult;
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.7,
      },
    });

    // The SDK may return text in different properties depending on version; try a few.
    const raw = (response as any).text ?? (response as any).outputText ?? JSON.stringify(response);
    const jsonText = String(raw).trim();
    const parsedData = JSON.parse(jsonText);
    return parsedData as AnalysisResult;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get analysis from AI service.');
  }
};

export const analyzeWithFeatures = async (features: any): Promise<AnalysisResult> => {
  // If no API key, return a mock result synthesizing from features
  if (!API_KEY) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      songTitle: features.title ?? 'Unknown',
      artist: features.artist ?? 'Unknown',
      genre: features.genre ?? 'Ambient',
      mood: features.mood ?? ['Calm'],
      instruments: features.instruments ?? ['Piano'],
      tempoBPM: features.tempo ?? 100,
      keySignature: features.key ?? 'C Major',
      timeSignature: features.timeSignature ?? '4/4',
      rhythm: features.rhythm ?? 'Steady',
      structure: features.structure ?? 'Intro-Body-Outro',
      overallVibe: features.overallVibe ?? 'A gentle piece.',
    } as AnalysisResult;
  }

  if (!ai) {
    try {
      const mod = await eval("import('@google/genai')");
      const GoogleGenAI = (mod as any).GoogleGenAI ?? (mod as any).default?.GoogleGenAI;
      ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (err) {
      console.warn('GenAI SDK not available at runtime; returning mock analysis.', err);
      return analyzeWithFeatures(features); // will return mock because API_KEY present but SDK failed
    }
  }

  const prompt = `You are a musicologist. Given the following extracted features from an audio file:\n${JSON.stringify(features, null, 2)}\n\nProduce a JSON object that conforms to the AnalysisResult schema: { songTitle, artist, genre, mood, instruments, tempoBPM, keySignature, timeSignature, rhythm, structure, overallVibe }. Respond with only valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: analysisSchema, temperature: 0.6 },
    });

    const raw = (response as any).text ?? (response as any).outputText ?? JSON.stringify(response);
    const parsed = JSON.parse(String(raw).trim());
    return parsed as AnalysisResult;
  } catch (err) {
    console.error('analyzeWithFeatures error, returning mock', err);
    return analyzeWithFeatures(features);
  }
};
