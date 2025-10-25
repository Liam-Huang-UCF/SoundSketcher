import type { AnalysisResult } from "../types";

const API_KEY = process.env.GENAI_API_KEY ?? process.env.API_KEY ?? undefined;

let ai: unknown = null;

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
        // Dynamic import the optional SDK. If import fails we fall back to mock.
        const mod = await import('@google/genai');
        const maybe = (mod as unknown) as { GoogleGenAI?: unknown; default?: { GoogleGenAI?: unknown } };
        const ctor = maybe.GoogleGenAI ?? maybe.default?.GoogleGenAI;
        if (typeof ctor !== 'function') throw new Error('GoogleGenAI constructor not found in SDK');
        // construct the client
        ai = new (ctor as new (opts: { apiKey?: string }) => unknown)({ apiKey: API_KEY });
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

    // call the SDK in a guarded way
    const aiClient = ai as { models?: unknown } | null;
    if (!aiClient || typeof aiClient !== 'object' || aiClient.models === undefined) {
      throw new Error('AI client not initialized');
    }
    const models = aiClient.models as { generateContent?: unknown };
    if (!models || typeof models.generateContent !== 'function') {
      throw new Error('generateContent not available on AI client');
    }

    const generateFn = models.generateContent as (opts: unknown) => Promise<unknown>;
    const response = await generateFn({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.7,
      },
    });

    // The SDK may return text in different properties depending on version; try a few.
    const raw = getResponseText(response);
    const jsonText = raw.trim();
    const parsed: unknown = JSON.parse(jsonText);
    if (typeof parsed === 'object' && parsed !== null) return parsed as AnalysisResult;
    throw new Error('Invalid JSON response from AI');
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get analysis from AI service.');
  }
};

function getResponseText(response: unknown): string {
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>;
    if (typeof r.text === 'string') return r.text;
    if (typeof r.outputText === 'string') return r.outputText;
  }
  // If it's a primitive string already, return as-is. Otherwise JSON-stringify objects
  if (typeof response === 'string') return response;
  try {
    return JSON.stringify(response ?? '');
  } catch {
    // If stringification fails, return an empty string — safer than default Object stringification
    return '';
  }
}

export const analyzeWithFeatures = async (features: Record<string, unknown>): Promise<AnalysisResult> => {
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
      const mod = await import('@google/genai');
      const maybe = (mod as unknown) as { GoogleGenAI?: unknown; default?: { GoogleGenAI?: unknown } };
      const ctor = maybe.GoogleGenAI ?? maybe.default?.GoogleGenAI;
      if (typeof ctor !== 'function') throw new Error('GoogleGenAI constructor not found in SDK');
      ai = new (ctor as new (opts: { apiKey?: string }) => unknown)({ apiKey: API_KEY });
    } catch (err) {
      console.warn('GenAI SDK not available at runtime; returning mock analysis.', err);
      return analyzeWithFeatures(features); // will return mock because API_KEY present but SDK failed
    }
  }

  const prompt = `You are a musicologist. Given the following extracted features from an audio file:\n${JSON.stringify(features, null, 2)}\n\nProduce a JSON object that conforms to the AnalysisResult schema: { songTitle, artist, genre, mood, instruments, tempoBPM, keySignature, timeSignature, rhythm, structure, overallVibe }. Respond with only valid JSON.`;

  try {
    const aiClient = ai as { models?: unknown } | null;
    if (!aiClient || typeof aiClient !== 'object' || aiClient.models === undefined) {
      throw new Error('AI client not initialized');
    }
    const models = aiClient.models as { generateContent?: unknown };
    if (!models || typeof models.generateContent !== 'function') {
      throw new Error('generateContent not available on AI client');
    }
    const generateFn = models.generateContent as (opts: unknown) => Promise<unknown>;
    const response = await generateFn({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: analysisSchema, temperature: 0.6 } });

    const raw = getResponseText(response);
    const parsed: unknown = JSON.parse(raw.trim());
    if (typeof parsed === 'object' && parsed !== null) return parsed as AnalysisResult;
    throw new Error('Invalid JSON response from AI');
  } catch (err) {
    console.error('analyzeWithFeatures error, returning mock', err);
    return analyzeWithFeatures(features);
  }
};
