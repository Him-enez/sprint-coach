import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  return NextResponse.json({ ok: true, hint: "Use POST to run AI" });
}

export async function POST(req: Request) {
  console.log("POST /api/coach hit");

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("GEMINI_API_KEY length:", apiKey?.length);

    if (!apiKey) {
      return NextResponse.json(
        { error: "ENV NOT LOADED: GEMINI_API_KEY missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    console.log("Request body keys:", body ? Object.keys(body) : null);

    const sessions = body?.sessions;
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: sessions must be a non-empty array" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an experienced elite sprint coach (60m/100m/200m specialist).
You follow modern sprint training principles (short-to-long, polarized approach, Pfaff/Francis/Tony Holler influence).
You analyze an athlete's recent sprint training sessions and provide a readiness assessment and a recommended next workout plan.
You consider factors like volume, intensity, frequency, notes on fatigue/injury, and progression over time.
You understand how isometrics and plyometrics fit into sprint training.
You tailor recommendations to the athlete's training history and current condition.
You suggest conservative volume/intensity increases to avoid injury.
You prioritize athlete health and long-term development over short-term performance gains.
You communicate clearly and concisely, avoiding jargon.

Analyze ONLY the following recent sprint sessions (most recent first):

${JSON.stringify(sessions.slice(0, 4), null, 2)}

Return ONLY valid JSON with NO markdown formatting, NO code fences, NO backticks. Just pure JSON in this exact structure:

{
  "Readiness": "low" | "medium" | "high",
  "Readiness Reason": "short 1-sentence explanation",
  "Recommended Session Type": "acceleration | maxVelocity | shortSpeedEndurance | speedEndurance | specialEndurance | tempo | recovery | off",
  "Workout": [
    "4 × 30m from blocks @ 98% (full recovery 6-8 min)",
    "3 × flying 20m @ max (from 30m build-up)"
  ],
  "Coach Notes": [
    "Focus on...",
    "Watch for...",
    "If calves feel tight again → reduce volume 20%"
  ],
  "Next Suggested Distance Range": "20-40m | 30-60m | 60-120m | 100-200m | 150-300m | 200-400m | N/A",
  "Warning": null | "string with serious concern if any (injury pattern, huge volume jump, etc.)"
}

CRITICAL: Return ONLY the JSON object. Do not wrap it in markdown code fences or backticks.`.trim();

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }] },
      ],
    });

    let text =
      (result as any).text?.trim?.() ??
      (result as any).response?.text?.()?.trim?.() ??
      "";

    console.log("AI raw text length:", text.length);

    if (!text) {
      return NextResponse.json(
        { error: "Empty AI response", debugResultKeys: Object.keys(result as any) },
        { status: 500 }
      );
    }

    // Strip markdown code fences if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    console.log("Cleaned text preview:", text.substring(0, 200));

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "AI did not return valid JSON", raw: text },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error("COACH ROUTE ERROR:", err);
    return NextResponse.json(
      {
        error: "Server error",
        name: err?.name,
        message: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}