/* ─────────────────────────────────────────────────────────────────────────────
   KeywordMatcher.jsx
   Extracts keywords from a job description and checks them against the
   candidate's resume using Gemini — gives an ATS compatibility score.
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { matchKeywords } from "../services/career.api";

// Returns fill class based on score
const fillClass = (n) => (n >= 70 ? "stat-bar__fill--high" : n >= 40 ? "stat-bar__fill--mid" : "stat-bar__fill--low");
const scoreColor = (n) => (n >= 70 ? "#2dd4bf" : n >= 40 ? "#f59e0b" : "#ef4444");

const IMPORTANCE_ORDER = { critical: 0, important: 1, "nice-to-have": 2 };

const KeywordMatcher = () => {
    const [resume, setResume] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [filter, setFilter] = useState("all"); // "all" | "missing" | "found"

    // ── Submit handler ──────────────────────────────────────────────────────
    const handleMatch = async () => {
        if (!resume.trim() || !jobDescription.trim()) {
            setError("Both resume text and job description are required.");
            return;
        }
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const res = await matchKeywords({ resume, jobDescription });
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Keyword matching failed.");
        } finally {
            setLoading(false);
        }
    };

    // Apply filter and sort by importance
    const filteredKeywords = result?.keywords
        ?.filter((k) => {
            if (filter === "missing") return !k.inResume;
            if (filter === "found") return k.inResume;
            return true;
        })
        ?.sort((a, b) => (IMPORTANCE_ORDER[a.importance] ?? 2) - (IMPORTANCE_ORDER[b.importance] ?? 2)) || [];

    return (
        <div className="tool-card">
            {/* ── Header ── */}
            <div className="tool-card__header">
                <span className="tool-card__icon">🔍</span>
                <div className="tool-card__title">
                    <h2>Resume Keyword Matching Engine</h2>
                    <p>Compares your resume against the JD using semantic analysis to boost your ATS score.</p>
                </div>
            </div>

            {/* ── Inputs ── */}
            <div className="tool-card__body">
                <div className="ct-row">
                    <div className="ct-field">
                        <label className="ct-label">Your Resume Text *</label>
                        <textarea
                            className="ct-textarea"
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                            placeholder="Paste your full resume text here..."
                            rows={6}
                        />
                    </div>
                    <div className="ct-field">
                        <label className="ct-label">Job Description *</label>
                        <textarea
                            className="ct-textarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here..."
                            rows={6}
                        />
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="tool-card__footer">
                <button className="ct-btn" onClick={handleMatch} disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze Keyword Match"}
                </button>
            </div>

            {/* ── Loading ── */}
            {loading && <div className="ct-spinner">Extracting and matching keywords...</div>}

            {/* ── Error ── */}
            {error && <div className="ct-error">⚠ {error}</div>}

            {/* ── Results ── */}
            {result && (
                <div className="ct-results">
                    {/* Score Summary */}
                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div>
                            <p className="ct-section-title" style={{ marginBottom: "0.4rem" }}>Keyword Match</p>
                            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: scoreColor(result.overallMatchScore), lineHeight: 1 }}>
                                {result.overallMatchScore}%
                            </div>
                        </div>
                        <div>
                            <p className="ct-section-title" style={{ marginBottom: "0.4rem" }}>ATS Score</p>
                            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: scoreColor(result.atsScore), lineHeight: 1 }}>
                                {result.atsScore}%
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="stat-bar" style={{ marginBottom: "0.5rem" }}>
                                <div className="stat-bar__header"><span>Match</span><span>{result.overallMatchScore}%</span></div>
                                <div className="stat-bar__track">
                                    <div className={`stat-bar__fill ${fillClass(result.overallMatchScore)}`} style={{ width: `${result.overallMatchScore}%` }} />
                                </div>
                            </div>
                            <div className="stat-bar">
                                <div className="stat-bar__header"><span>ATS Compatibility</span><span>{result.atsScore}%</span></div>
                                <div className="stat-bar__track">
                                    <div className={`stat-bar__fill ${fillClass(result.atsScore)}`} style={{ width: `${result.atsScore}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Insight */}
                    {result.summaryInsight && (
                        <p className="ct-insight">💡 {result.summaryInsight}</p>
                    )}

                    {/* Strong Keywords */}
                    {result.strongKeywords?.length > 0 && (
                        <div>
                            <p className="ct-section-title">✅ Strong Matches</p>
                            <div className="skill-badges">
                                {result.strongKeywords.map((k) => (
                                    <span key={k} className="skill-badge skill-badge--matched">{k}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing Critical Keywords */}
                    {result.missingCriticalKeywords?.length > 0 && (
                        <div>
                            <p className="ct-section-title">🚨 Missing Critical Keywords</p>
                            <div className="skill-badges">
                                {result.missingCriticalKeywords.map((k) => (
                                    <span key={k} className="skill-badge skill-badge--critical">{k}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Keyword Table with filter */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <p className="ct-section-title" style={{ marginBottom: 0 }}>All Keywords</p>
                            {["all", "found", "missing"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: "0.2rem 0.7rem",
                                        borderRadius: 999,
                                        border: "1px solid",
                                        fontSize: "0.72rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        textTransform: "capitalize",
                                        background: filter === f ? "rgba(79,110,247,0.15)" : "transparent",
                                        borderColor: filter === f ? "#4f6ef7" : "#2a3245",
                                        color: filter === f ? "#6b85f8" : "#8892b0",
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table className="kw-table">
                                <thead>
                                    <tr>
                                        <th>Keyword</th>
                                        <th>Importance</th>
                                        <th>Found</th>
                                        <th style={{ minWidth: 200 }}>Context / Suggestion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredKeywords.map((kw) => (
                                        <tr key={kw.keyword}>
                                            <td style={{ fontWeight: 500 }}>{kw.keyword}</td>
                                            <td>
                                                <span className={`skill-badge skill-badge--${kw.importance}`}>
                                                    {kw.importance}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`kw-table__status kw-table__status--${kw.inResume ? "yes" : "no"}`}>
                                                    {kw.inResume ? "✓" : "✗"}
                                                </span>
                                            </td>
                                            <td style={{ color: "#8892b0", fontSize: "0.83rem" }}>
                                                {kw.resumeContext || kw.suggestion}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Improvement Suggestions */}
                    {result.improvementSuggestions?.length > 0 && (
                        <div>
                            <p className="ct-section-title">🛠 How to Improve Your Resume</p>
                            <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                {result.improvementSuggestions.map((s, i) => (
                                    <li key={i} style={{ color: "#c5cfe8", fontSize: "0.88rem", lineHeight: 1.5 }}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default KeywordMatcher;
