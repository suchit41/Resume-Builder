/* ─────────────────────────────────────────────────────────────────────────────
   features.controller.js
   Handles HTTP layer for all 6 career-tool endpoints.
   Each controller validates required fields, delegates to features.service,
   and returns consistent { success, data } / { success, message } responses.

   OPTIONAL USER-SUPPLIED KEYS (received in request body, never stored):
   • githubToken    — POST /api/features/github-analyze
   • youtubeApiKey — POST /api/features/learning-resources
───────────────────────────────────────────────────────────────────────────── */

const featuresService = require("../services/features.service");

// ── Helper: send a 400 response for missing required fields ─────────────────
function requireFields(res, body, fields) {
    for (const field of fields) {
        if (!body[field] || (typeof body[field] === "string" && !body[field].trim())) {
            res.status(400).json({ success: false, message: `"${field}" is required` });
            return false;
        }
    }
    return true;
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/features/skill-trends
   Body: { jobTitle: string, resume?: string }
───────────────────────────────────────────────────────────────────────────── */
async function skillTrendsController(req, res) {
    const { jobTitle, resume } = req.body;

    if (!requireFields(res, req.body, ["jobTitle"])) return;

    try {
        const data = await featuresService.analyzeJobSkillTrends({ jobTitle, resume: resume || "" });
        res.json({ success: true, data });
    } catch (err) {
        console.error("[skillTrends]", err.message);
        res.status(500).json({ success: false, message: err.message || "Failed to analyze skill trends" });
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/features/github-analyze
   Body: { username: string, jobDescription?: string, githubToken?: string }
   githubToken is optional — raises rate limit from 60 → 5 000 req/hr
───────────────────────────────────────────────────────────────────────────── */
async function githubAnalyzeController(req, res) {
    // githubToken comes from the user's own browser — never stored server-side
    const { username, jobDescription, githubToken } = req.body;

    if (!requireFields(res, req.body, ["username"])) return;

    try {
        const data = await featuresService.analyzeGithubProfile({
            username,
            jobDescription: jobDescription || "",
            githubToken:    githubToken    || "",
        });
        res.json({ success: true, data });
    } catch (err) {
        console.error("[githubAnalyze]", err.message);
        const status = err.message.includes("not found") ? 404 : 500;
        res.status(status).json({ success: false, message: err.message || "GitHub analysis failed" });
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/features/generate-questions
   Body: { jobDescription: string, resume?: string,
           previousQuestion?: string, userAnswer?: string }
───────────────────────────────────────────────────────────────────────────── */
async function generateQuestionsController(req, res) {
    const { resume, jobDescription, previousQuestion, userAnswer } = req.body;

    if (!requireFields(res, req.body, ["jobDescription"])) return;

    try {
        const data = await featuresService.generateDynamicQuestions({
            resume:           resume           || "",
            jobDescription,
            previousQuestion: previousQuestion || "",
            userAnswer:       userAnswer       || "",
        });
        res.json({ success: true, data });
    } catch (err) {
        console.error("[generateQuestions]", err.message);
        res.status(500).json({ success: false, message: err.message || "Failed to generate questions" });
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/features/learning-resources
   Body: { skills: string[] | string, jobDescription?: string,
           youtubeApiKey?: string }
   youtubeApiKey — user's own YouTube Data API v3 key (10 000 free units/day)
   When provided: performs real YouTube search; otherwise AI curates resources.
───────────────────────────────────────────────────────────────────────────── */
async function learningResourcesController(req, res) {
    const { skills, jobDescription, youtubeApiKey } = req.body;

    if (!skills || (Array.isArray(skills) && skills.length === 0)) {
        return res.status(400).json({ success: false, message: '"skills" array is required' });
    }

    try {
        const data = await featuresService.findLearningResources({
            skills,
            jobDescription: jobDescription || "",
            youtubeApiKey:  youtubeApiKey  || "",
        });
        res.json({ success: true, data });
    } catch (err) {
        console.error("[learningResources]", err.message);
        // Surface YouTube API-specific errors so the frontend can show a helpful message
        const isYouTubeErr = err.message.toLowerCase().includes("youtube");
        res.status(500).json({
            success: false,
            message: isYouTubeErr
                ? `YouTube API error: ${err.message}`
                : err.message || "Failed to find learning resources",
        });
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/features/keyword-match
   Body: { resume: string, jobDescription: string }
───────────────────────────────────────────────────────────────────────────── */
async function keywordMatchController(req, res) {
    const { resume, jobDescription } = req.body;

    if (!requireFields(res, req.body, ["resume", "jobDescription"])) return;

    try {
        const data = await featuresService.matchResumeKeywords({ resume, jobDescription });
        res.json({ success: true, data });
    } catch (err) {
        console.error("[keywordMatch]", err.message);
        res.status(500).json({ success: false, message: err.message || "Keyword matching failed" });
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/features/evaluate-answer
   Body: { question: string, answer: string, jobDescription?: string }
───────────────────────────────────────────────────────────────────────────── */
async function evaluateAnswerController(req, res) {
    const { question, answer, jobDescription } = req.body;

    if (!requireFields(res, req.body, ["question", "answer"])) return;

    try {
        const data = await featuresService.evaluateInterviewAnswer({
            question,
            answer,
            jobDescription: jobDescription || "",
        });
        res.json({ success: true, data });
    } catch (err) {
        console.error("[evaluateAnswer]", err.message);
        res.status(500).json({ success: false, message: err.message || "Answer evaluation failed" });
    }
}

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
    skillTrendsController,
    githubAnalyzeController,
    generateQuestionsController,
    learningResourcesController,
    keywordMatchController,
    evaluateAnswerController,
};
