/* ─────────────────────────────────────────────────────────────────────────────
   AnswerEvaluator.jsx
   Sends an interview Q+A to Gemini, receives a detailed score and feedback
   across communication, relevance, depth, and specificity dimensions.
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { evaluateAnswer } from "../services/career.api";

// Map score 0-100 → fill class
const fillClass = (n) => (n >= 70 ? "stat-bar__fill--high" : n >= 40 ? "stat-bar__fill--mid" : "stat-bar__fill--low");
const scoreColor = (n) => (n >= 70 ? "#2dd4bf" : n >= 40 ? "#f59e0b" : "#ef4444");

const AnswerEvaluator = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    // ── Submit handler ──────────────────────────────────────────────────────
    const handleEvaluate = async () => {
        if (!question.trim() || !answer.trim()) {
            setError("Both question and your answer are required.");
            return;
        }
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const res = await evaluateAnswer({ question, answer, jobDescription });
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Evaluation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Dimension scores array for rendering bars
    const dimensions = result
        ? [
              { label: "Communication", value: result.dimensionScores?.communication },
              { label: "Relevance",      value: result.dimensionScores?.relevance },
              { label: "Depth",          value: result.dimensionScores?.depth },
              { label: "Specificity",    value: result.dimensionScores?.specificity },
          ]
        : [];

    return (
        <div className="tool-card">
            {/* ── Header ── */}
            <div className="tool-card__header">
                <span className="tool-card__icon">🎯</span>
                <div className="tool-card__title">
                    <h2>Interview Answer Evaluator</h2>
                    <p>Analyze your answer quality, get a score, and see a model ideal answer.</p>
                </div>
            </div>

            {/* ── Inputs ── */}
            <div className="tool-card__body">
                <div className="ct-field">
                    <label className="ct-label">Interview Question *</label>
                    <textarea
                        className="ct-textarea"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g. Tell me about a time you resolved a conflict within your team."
                        rows={2}
                    />
                </div>
                <div className="ct-field">
                    <label className="ct-label">Your Answer *</label>
                    <textarea
                        className="ct-textarea"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type or paste your answer here..."
                        rows={5}
                    />
                </div>
                <div className="ct-field">
                    <label className="ct-label">Job Description (optional — for better context)</label>
                    <input
                        className="ct-input"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste a snippet of the role's JD..."
                    />
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="tool-card__footer">
                <button className="ct-btn" onClick={handleEvaluate} disabled={loading}>
                    {loading ? "Evaluating..." : "Evaluate My Answer"}
                </button>
            </div>

            {/* ── Loading ── */}
            {loading && <div className="ct-spinner">AI coach is reviewing your answer...</div>}

            {/* ── Error ── */}
            {error && <div className="ct-error">⚠ {error}</div>}

            {/* ── Results ── */}
            {result && (
                <div className="ct-results eval-result">
                    {/* Overall score + grade */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                width: 88, height: 88, borderRadius: "50%",
                                border: `4px solid ${scoreColor(result.overallScore)}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexDirection: "column",
                            }}>
                                <span style={{ fontSize: "1.6rem", fontWeight: 800, color: scoreColor(result.overallScore), lineHeight: 1 }}>
                                    {result.overallScore}
                                </span>
                                <span style={{ fontSize: "0.65rem", color: "#8892b0", lineHeight: 1 }}>/100</span>
                            </div>
                        </div>
                        <div>
                            {/* Grade badge */}
                            <div className={`eval-result__grade eval-result__grade--${result.grade?.replace(/\s+/g, "-")}`}>
                                {result.grade}
                            </div>
                            {/* STAR format indicator */}
                            <div style={{ fontSize: "0.82rem", color: "#8892b0" }}>
                                STAR format: {result.starFormatUsed
                                    ? <span style={{ color: "#2dd4bf", fontWeight: 600 }}>✓ Used</span>
                                    : <span style={{ color: "#f59e0b" }}>✗ Not detected</span>}
                            </div>
                        </div>
                    </div>

                    {/* Dimension Score Bars */}
                    <div>
                        <p className="ct-section-title">Dimension Breakdown</p>
                        {dimensions.map((d) => (
                            <div key={d.label} className="stat-bar" style={{ marginBottom: "0.6rem" }}>
                                <div className="stat-bar__header">
                                    <span>{d.label}</span>
                                    <span style={{ color: scoreColor(d.value) }}>{d.value}/100</span>
                                </div>
                                <div className="stat-bar__track">
                                    <div className={`stat-bar__fill ${fillClass(d.value)}`} style={{ width: `${d.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Strengths */}
                    {result.strengths?.length > 0 && (
                        <div className="eval-result__section">
                            <h4>💚 What You Did Well</h4>
                            <ul>
                                {result.strengths.map((s, i) => (
                                    <li key={i} style={{ color: "#a7f3d0" }}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Improvements */}
                    {result.improvements?.length > 0 && (
                        <div className="eval-result__section">
                            <h4>🔧 Areas to Improve</h4>
                            <ul>
                                {result.improvements.map((s, i) => (
                                    <li key={i} style={{ color: "#fcd34d" }}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Ideal Answer */}
                    {result.idealAnswer && (
                        <div className="eval-result__section">
                            <h4>⭐ Model Ideal Answer</h4>
                            <p style={{ whiteSpace: "pre-line" }}>{result.idealAnswer}</p>
                        </div>
                    )}

                    {/* Follow-up Questions */}
                    {result.followUpQuestions?.length > 0 && (
                        <div className="eval-result__section">
                            <h4>❓ Likely Follow-Up Questions</h4>
                            <ul>
                                {result.followUpQuestions.map((q, i) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnswerEvaluator;
