/* ─────────────────────────────────────────────────────────────────────────────
   career.api.js
   Axios service layer for all 6 career-tool endpoints.
   Optional user-supplied API keys (youtubeApiKey, githubToken) are accepted
   per-request and forwarded to the backend — they are never stored.
───────────────────────────────────────────────────────────────────────────── */

import axios from "axios";

// Base instance — same host as the existing interview API
const api = axios.create({
    baseURL: "http://localhost:3000/api/features",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

/* ── Feature 1: Real-Time Job Skill Trend Analyzer ────────────────────────── */
export const analyzeSkillTrends = (payload) => api.post("/skill-trends", payload);

/* ── Feature 2: GitHub Profile Analyzer ─────────────────────────────────────
   payload.githubToken (optional) → raises rate limit to 5 000 req/hr          */
export const analyzeGitHub = (payload) => api.post("/github-analyze", payload);

/* ── Feature 3: Dynamic Interview Question Generator ─────────────────────── */
export const generateQuestions = (payload) => api.post("/generate-questions", payload);

/* ── Feature 4: Learning Resource Finder ─────────────────────────────────────
   payload.youtubeApiKey (optional) → enables real YouTube Data API v3 search  */
export const findLearningResources = (payload) => api.post("/learning-resources", payload);

/* ── Feature 5: Resume Keyword Matching Engine ────────────────────────────── */
export const matchKeywords = (payload) => api.post("/keyword-match", payload);

/* ── Feature 6: Interview Answer Evaluator ───────────────────────────────── */
export const evaluateAnswer = (payload) => api.post("/evaluate-answer", payload);
