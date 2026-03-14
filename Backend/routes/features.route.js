/* ─────────────────────────────────────────────────────────────────────────────
   features.route.js
   All career-tools endpoints are protected by the auth middleware so that
   only logged-in users can access them.

   Base path: /api/features  (registered in app.js)
───────────────────────────────────────────────────────────────────────────── */

const express = require("express");
const { authUser } = require("../middleware/auth.middleware");
const {
    skillTrendsController,
    githubAnalyzeController,
    generateQuestionsController,
    learningResourcesController,
    keywordMatchController,
    evaluateAnswerController,
} = require("../controllers/features.controller");

const featuresRouter = express.Router();

// All routes are protected — user must be authenticated
featuresRouter.use(authUser);

/* ── Feature 1: Real-Time Job Skill Trend Analyzer ────────────────────────── */
featuresRouter.post("/skill-trends", skillTrendsController);

/* ── Feature 2: GitHub Profile Analyzer ──────────────────────────────────── */
featuresRouter.post("/github-analyze", githubAnalyzeController);

/* ── Feature 3: Dynamic Interview Question Generator ─────────────────────── */
featuresRouter.post("/generate-questions", generateQuestionsController);

/* ── Feature 4: Learning Resource Finder ─────────────────────────────────── */
featuresRouter.post("/learning-resources", learningResourcesController);

/* ── Feature 5: Resume Keyword Matching Engine ────────────────────────────── */
featuresRouter.post("/keyword-match", keywordMatchController);

/* ── Feature 6: Interview Answer Evaluator ───────────────────────────────── */
featuresRouter.post("/evaluate-answer", evaluateAnswerController);

module.exports = featuresRouter;
