/* ─────────────────────────────────────────────────────────────────────────────
   QuestionGenerator.jsx
   Generates tailored interview questions from a JD + resume.
   Supports a "follow-up" mode: paste a previous Q+A to get deeper follow-ups.
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { generateQuestions } from "../services/career.api";

// Returns the badge CSS class for question type
const typeClass = (type) => `q-type-badge q-type-badge--${type}`;
const diffClass = (diff) => `q-type-badge q-type-badge--${diff}`;

const QuestionGenerator = () => {
    const [resume, setResume] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [prevQuestion, setPrevQuestion] = useState("");
    const [prevAnswer, setPrevAnswer] = useState("");
    const [isFollowUp, setIsFollowUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    // ── Submit handler ──────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            setError("Job description is required.");
            return;
        }
        if (isFollowUp && (!prevQuestion.trim() || !prevAnswer.trim())) {
            setError("Both previous question and your answer are required for follow-up mode.");
            return;
        }
        setError("");
        setResult(null);
        setLoading(true);
        try {
            const payload = { resume, jobDescription };
            if (isFollowUp) {
                payload.previousQuestion = prevQuestion;
                payload.userAnswer = prevAnswer;
            }
            const res = await generateQuestions(payload);
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Question generation failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tool-card">
            {/* ── Header ── */}
            <div className="tool-card__header">
                <span className="tool-card__icon">🤔</span>
                <div className="tool-card__title">
                    <h2>Dynamic Interview Question Generator</h2>
                    <p>Generates personalized questions from your JD and resume. Switch to follow-up mode to drill deeper.</p>
                </div>
            </div>

            {/* ── Mode Toggle ── */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <button
                    className={`ct-btn ${!isFollowUp ? "" : "ct-btn--secondary"}`}
                    onClick={() => setIsFollowUp(false)}
                    style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
                >
                    Initial Questions
                </button>
                <button
                    className={`ct-btn ${isFollowUp ? "" : "ct-btn--secondary"}`}
                    onClick={() => setIsFollowUp(true)}
                    style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
                >
                    Follow-Up Mode
                </button>
            </div>

            {/* ── Inputs ── */}
            <div className="tool-card__body">
                <div className="ct-field">
                    <label className="ct-label">Job Description *</label>
                    <textarea
                        className="ct-textarea"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description..."
                        rows={4}
                    />
                </div>

                {/* Resume — only shown in initial mode */}
                {!isFollowUp && (
                    <div className="ct-field">
                        <label className="ct-label">Your Resume Text (optional)</label>
                        <textarea
                            className="ct-textarea"
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                            placeholder="Paste resume text to make questions more personalized..."
                            rows={3}
                        />
                    </div>
                )}

                {/* Follow-up fields */}
                {isFollowUp && (
                    <>
                        <div className="ct-field">
                            <label className="ct-label">Previous Interview Question *</label>
                            <textarea
                                className="ct-textarea"
                                value={prevQuestion}
                                onChange={(e) => setPrevQuestion(e.target.value)}
                                placeholder="e.g. Tell me about a challenging project you've worked on."
                                rows={2}
                            />
                        </div>
                        <div className="ct-field">
                            <label className="ct-label">Your Answer to That Question *</label>
                            <textarea
                                className="ct-textarea"
                                value={prevAnswer}
                                onChange={(e) => setPrevAnswer(e.target.value)}
                                placeholder="Paste the answer you gave..."
                                rows={3}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="tool-card__footer">
                <button className="ct-btn" onClick={handleGenerate} disabled={loading}>
                    {loading ? "Generating..." : `Generate ${isFollowUp ? "Follow-ups" : "Questions"}`}
                </button>
            </div>

            {/* ── Loading ── */}
            {loading && <div className="ct-spinner">Crafting personalized interview questions...</div>}

            {/* ── Error ── */}
            {error && <div className="ct-error">⚠ {error}</div>}

            {/* ── Results ── */}
            {result && (
                <div className="ct-results">
                    {/* Interview tip */}
                    {result.interviewTip && (
                        <p className="ct-insight">💡 Tip: {result.interviewTip}</p>
                    )}

                    {/* Question count */}
                    <p className="ct-section-title">{result.questions?.length} Questions Generated</p>

                    {/* Question list */}
                    {result.questions?.map((q, i) => (
                        <div key={i} className="q-item">
                            {/* Type and difficulty badges */}
                            <div className="q-item__meta">
                                <span style={{ color: "#8892b0", fontSize: "0.78rem", fontWeight: 700 }}>Q{i + 1}</span>
                                <span className={typeClass(q.type)}>{q.type}</span>
                                <span className={diffClass(q.difficulty)}>{q.difficulty}</span>
                            </div>
                            {/* Question text */}
                            <div className="q-item__text">{q.question}</div>
                            {/* Why it's asked */}
                            <div style={{ fontSize: "0.8rem", color: "#8892b0", marginBottom: "0.4rem" }}>
                                <strong>Why asked:</strong> {q.whyAsked}
                            </div>
                            {/* Hint */}
                            <div className="q-item__hint">
                                <strong>Hint:</strong> {q.hint}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionGenerator;
