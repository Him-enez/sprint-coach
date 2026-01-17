"use client";

import { useState, useEffect } from "react";

type Session = {
  date: string;
  sets: number;
  reps: number;
  distance: string;
  intensity: string;
  notes: string;
};

type AICoachResponse = {
  Readiness?: string;
  "Readiness Reason"?: string;
  "Recommended Session Type"?: string;
  Workout?: string[];
  "Coach Notes"?: string[];
  "Next Suggested Distance Range"?: string;
  Warning?: string | null;
  error?: string;
  status?: number;
};

export default function Home() {
  const [distance, setDistance] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(1);
  const [aiCoach, setAiCoach] = useState<AICoachResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  async function askAICoach() {
    setLoadingAI(true);
    setAiCoach(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
      });

      const data = await res.json();
      setAiCoach({ status: res.status, ...data });
    } catch (e: any) {
      setAiCoach({ error: "Network error", status: 0 });
    } finally {
      setLoadingAI(false);
    }
  }

  // Load saved sessions on page load
  useEffect(() => {
    const saved = localStorage.getItem("sessions");
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newSession: Session = {
      date: new Date().toLocaleDateString(),
      distance,
      sets,
      reps,
      intensity,
      notes,
    };

    setSessions([newSession, ...sessions]);
    setTimeout(() => askAICoach(), 100);

    // reset form
    setSets(1);
    setReps(1);
    setDistance("");
    setIntensity("");
    setNotes("");
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-bold text-black">🏃‍♂️ Sprint Coach</h1>
        
        {/* AI Coach Section */}
        {sessions.length > 0 && (
          <div className="rounded-xl bg-white p-4 shadow space-y-3">
            <button
              onClick={askAICoach}
              disabled={loadingAI}
              className="w-full rounded bg-black py-2 text-white hover:bg-zinc-800 disabled:bg-zinc-400 transition"
            >
              {loadingAI ? "🤔 Analyzing..." : "🎯 Get Next Workout from AI Coach"}
            </button>

            <p className="text-sm text-zinc-500">
              Based on your past {Math.min(sessions.length, 4)} session
              {Math.min(sessions.length, 4) !== 1 ? "s" : ""}.
            </p>

            {aiCoach && (
              <div className="rounded-lg bg-zinc-50 p-4 text-sm text-black space-y-3 border border-zinc-200">
                {aiCoach.error && (
                  <div className="rounded bg-red-50 p-3 text-red-700 border border-red-200">
                    <p className="font-semibold">⚠️ Error</p>
                    <p>{aiCoach.error}</p>
                  </div>
                )}

                {!aiCoach.error && aiCoach.Readiness && (
                  <div className="space-y-3">
                    {/* Readiness Badge */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Readiness:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          aiCoach.Readiness === "high"
                            ? "bg-green-100 text-green-800"
                            : aiCoach.Readiness === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {aiCoach.Readiness?.toUpperCase()}
                      </span>
                    </div>
                    
                    {aiCoach["Readiness Reason"] && (
                      <p className="text-zinc-600 italic">
                        {aiCoach["Readiness Reason"]}
                      </p>
                    )}

                    {/* Session Type */}
                    {aiCoach["Recommended Session Type"] && (
                      <div>
                        <p className="font-semibold mb-1">📋 Session Type</p>
                        <p className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-blue-900">
                          {aiCoach["Recommended Session Type"]}
                        </p>
                      </div>
                    )}

                    {/* Workout Plan */}
                    {aiCoach.Workout && aiCoach.Workout.length > 0 && (
                      <div>
                        <p className="font-semibold mb-2">💪 Workout Plan</p>
                        <ul className="space-y-1 bg-white rounded p-3 border border-zinc-200">
                          {aiCoach.Workout.map((w: string, i: number) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-zinc-400">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Coach Notes */}
                    {aiCoach["Coach Notes"] && aiCoach["Coach Notes"].length > 0 && (
                      <div>
                        <p className="font-semibold mb-2">📝 Coach Notes</p>
                        <ul className="space-y-1 bg-amber-50 border border-amber-200 rounded p-3">
                          {aiCoach["Coach Notes"].map((n: string, i: number) => (
                            <li key={i} className="flex gap-2 text-amber-900">
                              <span className="text-amber-400">•</span>
                              <span>{n}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Distance Range */}
                    {aiCoach["Next Suggested Distance Range"] && 
                     aiCoach["Next Suggested Distance Range"] !== "N/A" && (
                      <div>
                        <p className="font-semibold mb-1">📏 Suggested Distance Range</p>
                        <p className="text-zinc-700">
                          {aiCoach["Next Suggested Distance Range"]}
                        </p>
                      </div>
                    )}

                    {/* Warning */}
                    {aiCoach.Warning && (
                      <div className="rounded bg-orange-50 p-3 text-orange-900 border border-orange-200">
                        <p className="font-semibold">⚠️ Warning</p>
                        <p className="text-sm">{aiCoach.Warning}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Log Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-black p-5 shadow-lg"
        >
          <h2 className="text-xl font-semibold text-white">Log New Session</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white">Sets</label>
              <input
                type="number"
                min={1}
                className="w-full rounded border border-zinc-300 p-2"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-white">Reps per Set</label>
              <input
                type="number"
                min={1}
                className="w-full rounded border border-zinc-300 p-2"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white">Distance</label>
            <input
              className="w-full rounded border border-zinc-300 p-2"
              placeholder="e.g., 30, 60, 100, 200"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              onBlur={() => {
                if (distance && !distance.trim().endsWith("m")) {
                  setDistance(distance.trim() + "m");
                }
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white">Intensity</label>
            <input
              className="w-full rounded border border-zinc-300 p-2"
              placeholder="e.g., 80, 90, 95 (will auto-add %)"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              onBlur={() => {
                if (intensity && !intensity.trim().endsWith("%")) {
                  setIntensity(intensity.trim() + "%");
                }
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white">Notes (Optional)</label>
            <textarea
              className="w-full rounded border border-zinc-300 p-2 resize-none"
              rows={3}
              placeholder="e.g., felt smooth, tight calves, windy conditions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button className="w-full rounded bg-white py-2.5 text-black font-semibold hover:bg-zinc-100 transition">
            💾 Save Session
          </button>
        </form>

        {/* Session History */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-black">📊 History</h2>

          {sessions.length === 0 && (
            <p className="text-zinc-500 text-center py-8">
              No sessions logged yet. Start by logging your first sprint session above!
            </p>
          )}

          {sessions.map((s, i) => (
            <div
              key={i}
              className="rounded-lg bg-white p-4 shadow hover:shadow-md transition flex justify-between items-start gap-3"
            >
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-zinc-800">{s.date}</p>
                <p className="text-lg font-medium text-black">
                  {s.sets > 1 ? `${s.sets} × ${s.reps} × ` : ""}{s.distance}
                </p>
                <p className="text-sm text-zinc-600">
                  <span className="font-medium">Intensity:</span> {s.intensity}
                </p>
                {s.notes && (
                  <p className="text-sm text-zinc-500 italic bg-zinc-50 rounded p-2 mt-2">
                    "{s.notes}"
                  </p>
                )}
              </div>

              <button
                onClick={() => setSessions(sessions.filter((_, idx) => idx !== i))}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1.5 transition"
                aria-label="Delete session"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}