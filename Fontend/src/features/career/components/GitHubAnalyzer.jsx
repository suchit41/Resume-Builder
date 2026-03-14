/* ─────────────────────────────────────────────────────────────────────────────
   GitHubAnalyzer.jsx
   Fetches profile + repos via the FREE GitHub REST API, then uses
   OpenAI / Gemini to match them against a job description.

   GitHub token (optional, user-supplied):
   • Without token: 60 requests/hour (unauthenticated)
   • With token:  5 000 requests/hour (authenticated)
   Generate a free token: github.com → Settings → Developer settings →
   Personal access tokens → Tokens (classic) → public_repo scope (read-only)
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { analyzeGitHub } from "../services/career.api";

// Score color class helper
const scoreClass = (n) => (n >= 75 ? "score--high" : n >= 50 ? "score--mid" : "score--low");

const GitHubAnalyzer = () => {
    const [username, setUsername]         = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [githubToken, setGithubToken]   = useState("");
    const [showTokenInfo, setShowTokenInfo] = useState(false); // toggle help text
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState("");
    const [result, setResult]             = useState(null);

    // ── Submit handler ──────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!username.trim()) {
            setError("Please enter a GitHub username.");
            return;
        }
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const res = await analyzeGitHub({
                username: username.trim(),
                jobDescription,
                // Only send token if the user actually typed one
                ...(githubToken.trim() ? { githubToken: githubToken.trim() } : {}),
            });
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "GitHub analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    const prof = result?.profile;

    return (
        <div className="tool-card">
            {/* ── Header ── */}
            <div className="tool-card__header">
                <span className="tool-card__icon">🐙</span>
                <div className="tool-card__title">
                    <h2>GitHub Profile Analyzer</h2>
                    <p>Evaluates repos and matches them against a job description using AI.</p>
                </div>
            </div>

            {/* ── Inputs ── */}
            <div className="tool-card__body">
                <div className="ct-row">
                    <div className="ct-field">
                        <label className="ct-label">GitHub Username *</label>
                        <input
                            className="ct-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. torvalds"
                        />
                    </div>
                    <div className="ct-field">
                        <label className="ct-label">Job Description (optional)</label>
                        <input
                            className="ct-input"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste job title or short JD for relevance matching"
                        />
                    </div>
                </div>

                {/* ── GitHub Token (optional, user-end) ──────────────────── */}
                <div style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: 10, padding: "0.85rem 1rem" }}>
                    {/* Toggle header */}
                    <div
                        style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", userSelect: "none" }}
                        onClick={() => setShowTokenInfo((v) => !v)}
                    >
                        <span style={{ fontSize: "1rem" }}>🐙</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2dd4bf" }}>
                            Optional: GitHub Personal Access Token
                        </span>
                        <span style={{ marginLeft: "auto", color: "#4c566a", fontSize: "0.75rem" }}>
                            {showTokenInfo ? "▲ hide" : "▼ show"}
                        </span>
                    </div>

                    {/* Help text */}
                    {showTokenInfo && (
                        <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#8892b0", lineHeight: 1.6 }}>
                            <p style={{ marginBottom: "0.5rem" }}>
                                Without a token the GitHub API allows <strong style={{ color: "#a5b4fc" }}>60 requests/hour</strong>.
                                With a token it rises to <strong style={{ color: "#a5b4fc" }}>5 000 requests/hour</strong>.
                            </p>
                            <p style={{ marginBottom: "0.75rem" }}>
                                🆓 Generate a free read-only token:{" "}
                                <a
                                    href="https://github.com/settings/tokens/new"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "#6b85f8", textDecoration: "none" }}
                                >
                                    github.com/settings/tokens ↗
                                </a>
                                {" "}→ select <em>public_repo</em> scope only.
                            </p>
                            <div className="ct-field">
                                <label className="ct-label">Personal Access Token</label>
                                <input
                                    className="ct-input"
                                    type="password"     /* mask token in UI */
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    placeholder="ghp_..."
                                    autoComplete="off"
                                />
                            </div>
                            {githubToken && (
                                <p style={{ marginTop: "0.4rem", color: "#2dd4bf", fontSize: "0.8rem" }}>
                                    ✓ Token entered — 5 000 req/hr rate limit will be used
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="tool-card__footer">
                <button className="ct-btn" onClick={handleAnalyze} disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze Profile"}
                </button>
                {result?.usedToken && (
                    <span style={{ fontSize: "0.78rem", color: "#2dd4bf" }}>
                        ✓ Authenticated · {result.totalReposAnalyzed} repos analyzed
                    </span>
                )}
            </div>

            {/* ── Loading ── */}
            {loading && <div className="ct-spinner">Fetching repositories from GitHub API...</div>}

            {/* ── Error ── */}
            {error && <div className="ct-error">⚠ {error}</div>}

            {/* ── Results ── */}
            {result && (
                <div className="ct-results">
                    {/* Profile Card */}
                    {prof && (
                        <div className="gh-profile">
                            {prof.avatarUrl && (
                                <img className="gh-profile__avatar" src={prof.avatarUrl} alt={prof.username} />
                            )}
                            <div style={{ flex: 1 }}>
                                <div className="gh-profile__name">{prof.name || prof.username}</div>
                                {prof.bio && <div className="gh-profile__bio">{prof.bio}</div>}
                                <div className="gh-profile__meta">
                                    {prof.publicRepos} public repos · {prof.followers} followers
                                </div>
                            </div>
                            <a href={prof.profileUrl} target="_blank" rel="noreferrer" className="gh-profile__link">
                                View on GitHub ↗
                            </a>
                        </div>
                    )}

                    {/* Overall Scores */}
                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                        {[
                            { label: "Job Match",        value: result.overallMatchScore },
                            { label: "Portfolio Quality", value: result.portfolioScore },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ textAlign: "center" }}>
                                <div
                                    className={`score-ring__circle score-ring__circle--${scoreClass(value)}`}
                                    style={{ width: 72, height: 72, border: "3px solid", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", margin: "0 auto 0.25rem" }}
                                >
                                    <span style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1 }}>{value}</span>
                                    <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>%</span>
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#8892b0" }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Top Languages */}
                    {result.topLanguages?.length > 0 && (
                        <div>
                            <p className="ct-section-title">Top Languages</p>
                            {result.topLanguages.map((lang) => (
                                <div key={lang.language} className="stat-bar" style={{ marginBottom: "0.6rem" }}>
                                    <div className="stat-bar__header">
                                        <span>{lang.language}</span>
                                        <span style={{ textTransform: "capitalize", fontSize: "0.78rem", color: "#8892b0" }}>
                                            {lang.proficiencyLevel} · {lang.projectCount} repo{lang.projectCount !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="stat-bar__track">
                                        <div
                                            className="stat-bar__fill stat-bar__fill--accent"
                                            style={{ width: `${Math.min(100, lang.projectCount * 15)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Project Highlights */}
                    {result.projectHighlights?.length > 0 && (
                        <div>
                            <p className="ct-section-title">Project Highlights</p>
                            {result.projectHighlights.map((proj) => (
                                <div key={proj.name} className="q-item" style={{ marginBottom: "0.6rem" }}>
                                    <div className="q-item__meta">
                                        <span className="skill-badge skill-badge--technical">{proj.name}</span>
                                        <span className={`skill-badge ${proj.relevanceScore >= 70 ? "skill-badge--matched" : "skill-badge--missing"}`}>
                                            {proj.relevanceScore}% match
                                        </span>
                                    </div>
                                    <div className="q-item__text">{proj.description}</div>
                                    <div className="q-item__hint">{proj.whyRelevant}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Strengths */}
                    {result.strengthAreas?.length > 0 && (
                        <div>
                            <p className="ct-section-title">💪 Strengths</p>
                            <div className="skill-badges">
                                {result.strengthAreas.map((s) => (
                                    <span key={s} className="skill-badge skill-badge--matched">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Profile Gaps */}
                    {result.profileGaps?.length > 0 && (
                        <div>
                            <p className="ct-section-title">🎯 Profile Gaps</p>
                            <div className="skill-badges">
                                {result.profileGaps.map((g) => (
                                    <span key={g} className="skill-badge skill-badge--missing">{g}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendation */}
                    {result.recommendation && (
                        <p className="ct-insight">💡 {result.recommendation}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default GitHubAnalyzer;
