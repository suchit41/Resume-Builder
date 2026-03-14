/* ─────────────────────────────────────────────────────────────────────────────
   SkillTrendAnalyzer.jsx
   Fetches live job listings via Remotive (free API) and uses Gemini to extract
   skill frequency, trends, and compare them with the candidate's resume.
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { analyzeSkillTrends } from "../services/career.api";

// Map skill categories to colours defined in career.scss
const CATEGORY_CLASS = {
    technical: "skill-badge--technical",
    soft: "skill-badge--soft",
    tools: "skill-badge--tools",
    frameworks: "skill-badge--frameworks",
    cloud: "skill-badge--cloud",
};

const SkillTrendAnalyzer = () => {
    const [jobTitle, setJobTitle] = useState("");
    const [resume, setResume] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    // ── Submit handler ──────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!jobTitle.trim()) {
            setError("Please enter a job title.");
            return;
        }
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const res = await analyzeSkillTrends({ jobTitle, resume });
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Compute the max frequency for bar scaling
    const maxFreq = result?.skillFrequency?.reduce((m, s) => Math.max(m, s.frequency), 1) || 1;

    return (
        <div className="tool-card">
            {/* ── Header ── */}
            <div className="tool-card__header">
                <span className="tool-card__icon">📊</span>
                <div className="tool-card__title">
                    <h2>Real-Time Job Skill Trends</h2>
                    <p>Scrapes live job listings to extract in-demand skills and compare them with your profile.</p>
                </div>
            </div>

            {/* ── Inputs ── */}
            <div className="tool-card__body">
                <div className="ct-field">
                    <label className="ct-label">Job Title / Role *</label>
                    <input
                        className="ct-input"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Frontend Engineer, Data Scientist"
                    />
                </div>
                <div className="ct-field">
                    <label className="ct-label">Your Resume Text (optional — for gap analysis)</label>
                    <textarea
                        className="ct-textarea"
                        value={resume}
                        onChange={(e) => setResume(e.target.value)}
                        placeholder="Paste your resume text here to see which trending skills you already have..."
                        rows={4}
                    />
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="tool-card__footer">
                <button className="ct-btn" onClick={handleAnalyze} disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze Trends"}
                </button>
                {result && (
                    <span style={{ fontSize: "0.8rem", color: "#8892b0" }}>
                        {result.jobsAnalyzed} listings analyzed · Source: {result.source}
                    </span>
                )}
            </div>

            {/* ── Loading ── */}
            {loading && <div className="ct-spinner">Fetching live job listings and analyzing skills...</div>}

            {/* ── Error ── */}
            {error && <div className="ct-error">⚠ {error}</div>}

            {/* ── Results ── */}
            {result && (
                <div className="ct-results">
                    {/* Market Insight */}
                    <p className="ct-insight">💡 {result.marketInsight}</p>

                    {/* Skill Frequency Bars */}
                    <div>
                        <p className="ct-section-title">Skill Frequency in Job Market</p>
                        {result.skillFrequency?.map((skill) => (
                            <div key={skill.skill} className="trend-row">
                                <span className="trend-row__name">{skill.skill}</span>
                                <div className="trend-row__bar-track">
                                    <div
                                        className="trend-row__bar-fill"
                                        style={{ width: `${(skill.frequency / maxFreq) * 100}%` }}
                                    />
                                </div>
                                <span className="trend-row__freq">{skill.frequency}</span>
                                <span className={`trend-row__trend trend-row__trend--${skill.trend}`}>{skill.trend}</span>
                                <span className={`skill-badge ${CATEGORY_CLASS[skill.category] || "skill-badge--technical"}`}>{skill.category}</span>
                            </div>
                        ))}
                    </div>

                    {/* Skills you have */}
                    {result.resumeMatchedSkills?.length > 0 && (
                        <div>
                            <p className="ct-section-title">✅ Skills You Already Have</p>
                            <div className="skill-badges">
                                {result.resumeMatchedSkills.map((s) => (
                                    <span key={s} className="skill-badge skill-badge--matched">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills you're missing */}
                    {result.resumeMissingSkills?.length > 0 && (
                        <div>
                            <p className="ct-section-title">🎯 High-Demand Skills to Learn</p>
                            <div className="skill-badges">
                                {result.resumeMissingSkills.map((s) => (
                                    <span key={s} className="skill-badge skill-badge--missing">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top priorities */}
                    {result.topSkillsToLearn?.length > 0 && (
                        <div>
                            <p className="ct-section-title">🏆 Top 5 Skills to Prioritize</p>
                            <ol style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                {result.topSkillsToLearn.map((s, i) => (
                                    <li key={i} style={{ color: "#c5cfe8", fontSize: "0.9rem" }}>{s}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SkillTrendAnalyzer;
