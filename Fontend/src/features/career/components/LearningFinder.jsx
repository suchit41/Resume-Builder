/* ─────────────────────────────────────────────────────────────────────────────
   LearningFinder.jsx
   Curates FREE learning resources for any skill set.

   Two modes:
   • Without YouTube API key → AI (OpenAI/Gemini) recommends known resources
   • With YouTube API key    → Real YouTube Data API v3 search per skill
     (Free tier: 10 000 units/day · each search = 100 units → ~100 searches/day)
     Get a free key: console.developers.google.com → "YouTube Data API v3"
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { findLearningResources } from "../services/career.api";

// Platform icon mapping (emoji fallbacks)
const PLATFORM_ICON = {
    YouTube: "▶️",
    freeCodeCamp: "🔷",
    "freeCodeCamp.org": "🔷",
    MDN: "🦊",
    "MDN Web Docs": "🦊",
    Coursera: "🎓",
    "edX": "🎓",
    "Official Docs": "📄",
    Documentation: "📄",
    "Dev.to": "👩‍💻",
    Medium: "✍️",
    GitHub: "🐙",
};

const getIcon = (platform) => PLATFORM_ICON[platform] || "🔗";

const TYPE_CLASS = {
    video: "skill-badge--technical",
    course: "skill-badge--soft",
    documentation: "skill-badge--tools",
    article: "skill-badge--frameworks",
    interactive: "skill-badge--cloud",
};

const LearningFinder = () => {
    const [skillInput, setSkillInput]       = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [youtubeApiKey, setYoutubeApiKey] = useState("");
    const [showKeyInfo, setShowKeyInfo]     = useState(false);  // toggle help text
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState("");
    const [result, setResult]               = useState(null);

    // ── Submit — convert comma-separated skill input to an array ────────────
    const handleFind = async () => {
        if (!skillInput.trim()) {
            setError("Please enter at least one skill.");
            return;
        }
        const skills = skillInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        setError("");
        setResult(null);
        setLoading(true);
        try {
            // youtubeApiKey is forwarded only if the user actually typed one
            const res = await findLearningResources({
                skills,
                jobDescription,
                ...(youtubeApiKey.trim() ? { youtubeApiKey: youtubeApiKey.trim() } : {}),
            });
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Resource search failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tool-card">
            {/* ── Header ── */}
            <div className="tool-card__header">
                <span className="tool-card__icon">📚</span>
                <div className="tool-card__title">
                    <h2>Learning Resource Finder</h2>
                    <p>
                        AI curates FREE resources · Add your YouTube API key for real-time video search.
                    </p>
                </div>
            </div>

            {/* ── Inputs ── */}
            <div className="tool-card__body">

                {/* Skills */}
                <div className="ct-field">
                    <label className="ct-label">Skills to Learn * (comma-separated)</label>
                    <input
                        className="ct-input"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="e.g. React, TypeScript, System Design, Docker"
                    />
                </div>

                {/* Job context */}
                <div className="ct-field">
                    <label className="ct-label">Job Context (optional)</label>
                    <textarea
                        className="ct-textarea"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste a snippet of the job description for better relevance..."
                        rows={2}
                    />
                </div>

                {/* ── YouTube API Key (optional, user-end) ───────────────── */}
                <div style={{ background: "rgba(79,110,247,0.04)", border: "1px solid rgba(79,110,247,0.15)", borderRadius: 10, padding: "0.85rem 1rem" }}>
                    {/* Toggle header */}
                    <div
                        style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", userSelect: "none" }}
                        onClick={() => setShowKeyInfo((v) => !v)}
                    >
                        <span style={{ fontSize: "1rem" }}>▶️</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#6b85f8" }}>
                            Optional: YouTube Data API Key
                        </span>
                        <span style={{ marginLeft: "auto", color: "#4c566a", fontSize: "0.75rem" }}>
                            {showKeyInfo ? "▲ hide" : "▼ show"}
                        </span>
                    </div>

                    {/* Help text — toggled */}
                    {showKeyInfo && (
                        <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#8892b0", lineHeight: 1.6 }}>
                            <p style={{ marginBottom: "0.5rem" }}>
                                Without a key, AI recommends well-known YouTube channels.<br />
                                With your <strong style={{ color: "#a5b4fc" }}>YouTube Data API v3</strong> key,
                                we search YouTube in real time and show actual videos.
                            </p>
                            <p style={{ marginBottom: "0.75rem" }}>
                                🆓 Free tier: <strong style={{ color: "#a5b4fc" }}>10 000 units/day</strong>
                                — each search uses 100 units, so ≈ 100 free searches/day.
                                <a
                                    href="https://console.developers.google.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ marginLeft: "0.4rem", color: "#6b85f8", textDecoration: "none" }}
                                >
                                    Get key ↗
                                </a>
                            </p>
                            <div className="ct-field">
                                <label className="ct-label">YouTube Data API v3 Key</label>
                                <input
                                    className="ct-input"
                                    type="password"     /* mask key in UI */
                                    value={youtubeApiKey}
                                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                                    placeholder="AIza..."
                                    autoComplete="off"
                                />
                            </div>
                            {youtubeApiKey && (
                                <p style={{ marginTop: "0.4rem", color: "#2dd4bf", fontSize: "0.8rem" }}>
                                    ✓ Key entered — real YouTube search will be used
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="tool-card__footer">
                <button className="ct-btn" onClick={handleFind} disabled={loading}>
                    {loading ? "Finding Resources..." : "Find Learning Resources"}
                </button>
                {result?.youtubeApiUsed && (
                    <span style={{ fontSize: "0.78rem", color: "#2dd4bf" }}>
                        ▶️ Real YouTube results · {result.skillResources?.length} skills
                    </span>
                )}
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="ct-spinner">
                    {youtubeApiKey
                        ? "Searching YouTube API + curating additional resources..."
                        : "AI is curating the best free resources for you..."}
                </div>
            )}

            {/* ── Error ── */}
            {error && <div className="ct-error">⚠ {error}</div>}

            {/* ── Results ── */}
            {result && (
                <div className="ct-results">
                    {/* Summary banner */}
                    {result.totalEstimatedWeeks && (
                        <p className="ct-insight">
                            📅 Estimated time to job-ready:{" "}
                            <strong>{result.totalEstimatedWeeks} weeks</strong> with consistent effort.
                        </p>
                    )}

                    {/* Per-skill resource lists */}
                    {result.skillResources?.map((skillGroup) => (
                        <div key={skillGroup.skill}>
                            <p className="ct-section-title">
                                {skillGroup.skill}
                                {skillGroup.estimatedHours > 0 && (
                                    <span style={{ fontWeight: 400, color: "#8892b0", marginLeft: "0.5rem", textTransform: "none", letterSpacing: 0 }}>
                                        (~{skillGroup.estimatedHours}h to job-ready)
                                    </span>
                                )}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {skillGroup.resources?.map((r, i) => (
                                    <a
                                        key={i}
                                        href={r.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="resource-card"
                                    >
                                        {/* Show YouTube thumbnail for real results */}
                                        {r.thumbnail ? (
                                            <img
                                                src={r.thumbnail}
                                                alt={r.title}
                                                style={{ width: 80, height: 54, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                                            />
                                        ) : (
                                            <span className="resource-card__icon">{getIcon(r.platform)}</span>
                                        )}
                                        <div className="resource-card__body">
                                            <div className="resource-card__title">{r.title}</div>
                                            <div className="resource-card__meta">
                                                <span>{r.channelName || r.platform}</span>
                                                <span>·</span>
                                                <span
                                                    className={`skill-badge ${TYPE_CLASS[r.type] || "skill-badge--technical"}`}
                                                    style={{ padding: "0.1rem 0.4rem", fontSize: "0.68rem" }}
                                                >
                                                    {r.type}
                                                </span>
                                                <span
                                                    className={`skill-badge ${r.level === "beginner" ? "skill-badge--matched" : r.level === "intermediate" ? "skill-badge--tools" : "skill-badge--missing"}`}
                                                    style={{ padding: "0.1rem 0.4rem", fontSize: "0.68rem" }}
                                                >
                                                    {r.level}
                                                </span>
                                            </div>
                                            {r.description && (
                                                <div className="resource-card__desc">{r.description}</div>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Week-by-week learning path */}
                    {result.suggestedLearningPath?.length > 0 && (
                        <div>
                            <p className="ct-section-title">📅 Suggested Learning Path</p>
                            {result.suggestedLearningPath.map((week) => (
                                <div key={week.week} className="q-item" style={{ marginBottom: "0.5rem" }}>
                                    <div className="q-item__meta">
                                        <span className="skill-badge skill-badge--technical">Week {week.week}</span>
                                    </div>
                                    <div className="q-item__text" style={{ fontWeight: 600 }}>{week.focus}</div>
                                    <div className="skill-badges" style={{ marginTop: "0.4rem" }}>
                                        {week.skills?.map((s) => (
                                            <span key={s} className="skill-badge skill-badge--tools" style={{ fontSize: "0.72rem" }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LearningFinder;
