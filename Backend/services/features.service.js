/* ─────────────────────────────────────────────────────────────────────────────
   features.service.js
   AI-powered career tools with three-provider support.

   AI PROVIDER PRIORITY  (first available key wins; falls back automatically)
   ┌────────────────────┬─────────────────────────────────────────────────────┐
   │ GOOGLE_GENAI_API_* │ Gemini — native responseSchema (exact field names)  │
   │ GROQ_API_KEY       │ Groq  — llama-3.3-70b-versatile  (fast, free tier) │
   │ OPENAI_API_KEY     │ OpenAI — gpt-4o-mini (fallback)                     │
   └────────────────────┴─────────────────────────────────────────────────────┘
   Gemini is primary because its responseSchema enforces exact field names at
   the API level — Groq/OpenAI use json_object mode which only hints at JSON.

   OPTIONAL USER-SUPPLIED KEYS (passed per-request, never stored)
   • youtubeApiKey  → real YouTube Data API v3 search in findLearningResources
   • githubToken    → raises GitHub REST rate limit 60 → 5 000 req/hr
───────────────────────────────────────────────────────────────────────────── */

const { GoogleGenAI } = require("@google/genai");
const { OpenAI }      = require("openai");   // correct CJS destructure
const { z }           = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

// ── Groq client (lazy) — OpenAI-compatible, custom baseURL ──────────────────
let _groq = null;
function getGroq() {
    if (!_groq) {
        _groq = new OpenAI({
            apiKey:  process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }
    return _groq;
}

// ── OpenAI client (lazy) ─────────────────────────────────────────────────────
let _openai = null;
function getOpenAI() {
    if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _openai;
}

// ── Gemini client (lazy) ─────────────────────────────────────────────────────
let _gemini = null;
function getGemini() {
    if (!_gemini) _gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
    return _gemini;
}

// Model identifiers
const GROQ_MODEL   = "llama-3.3-70b-versatile"; // Groq's best JSON-mode model
const OPENAI_MODEL = "gpt-4o-mini";
const GEMINI_MODEL = "gemini-2.0-flash";

// ── Helper: strip markdown fences and parse JSON safely ─────────────────────
function safeJsonParse(text) {
    if (!text || typeof text !== "string") return null;
    try {
        return JSON.parse(text);
    } catch {
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        try { return JSON.parse(cleaned); } catch { return null; }
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   GEMINI HELPER
   Uses native responseSchema — field names and enum values are enforced at
   the API level, so the model cannot return wrong field names.
───────────────────────────────────────────────────────────────────────────── */
async function callGemini(prompt, schema) {
    const response = await getGemini().models.generateContent({
        model:    GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema:   zodToJsonSchema(schema), // API-level schema enforcement
        },
    });
    const parsed = safeJsonParse(response.text);
    if (!parsed) throw new Error("Gemini returned invalid JSON");
    console.log(`[AI] Gemini OK — keys: ${Object.keys(parsed).join(", ")}`);
    return parsed;
}

/* ─────────────────────────────────────────────────────────────────────────────
   GROQ / OPENAI HELPER
   Generates a concrete example JSON from the schema so the model can see
   the exact field names and nesting. LLMs follow examples far more reliably
   than abstract schema descriptions or field lists.
───────────────────────────────────────────────────────────────────────────── */

// Recursively build a minimal example value from a JSON-Schema property node
function schemaToExample(propSchema) {
    if (!propSchema || typeof propSchema !== "object") return null;
    if (propSchema.type === "string")  return propSchema.enum ? propSchema.enum[0] : "example text";
    if (propSchema.type === "number")  return 75;
    if (propSchema.type === "boolean") return true;
    if (propSchema.type === "array") {
        return [schemaToExample(propSchema.items || { type: "string" })];
    }
    if (propSchema.type === "object") {
        const obj = {};
        for (const [k, v] of Object.entries(propSchema.properties || {})) {
            obj[k] = schemaToExample(v);
        }
        return obj;
    }
    return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPE COERCION — fixes mismatches when Groq returns the wrong type for a
   field (e.g. an object where the schema says string).
   Operates only on the top-level properties of the response object.
───────────────────────────────────────────────────────────────────────────── */
function coerceToSchema(data, jsonSchema) {
    if (!data || typeof data !== "object" || !jsonSchema?.properties) return data;

    const result = { ...data }; // shallow copy — we only fix top-level fields

    for (const [key, def] of Object.entries(jsonSchema.properties)) {
        const val = result[key];

        // Provide a sensible default for missing fields
        if (val === undefined || val === null) {
            if (def.type === "string")  result[key] = "";
            else if (def.type === "number")  result[key] = 0;
            else if (def.type === "boolean") result[key] = false;
            else if (def.type === "array")   result[key] = [];
            else if (def.type === "object")  result[key] = {};
            continue;
        }

        if (def.type === "string" && typeof val !== "string") {
            // Convert an unexpected object into a human-readable sentence
            if (typeof val === "object") {
                result[key] = Object.entries(val)
                    .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").trim()}: ${v}`)
                    .join(". ");
            } else {
                result[key] = String(val);
            }
        } else if (def.type === "number" && typeof val !== "number") {
            result[key] = Number(val) || 0;
        } else if (def.type === "boolean" && typeof val !== "boolean") {
            result[key] = Boolean(val);
        } else if (def.type === "array" && !Array.isArray(val)) {
            // If the AI returned an object instead of an array, take its values
            result[key] = typeof val === "object" ? Object.values(val) : [];
        }
        // If type matches, leave the value as-is
    }

    return result;
}

async function callOpenAICompatible(client, model, prompt, schema) {
    const jsonSchema  = zodToJsonSchema(schema);

    // Build an example that shows exact camelCase field names + nested structure
    const exampleObj  = schemaToExample(jsonSchema);
    const exampleJson = JSON.stringify(exampleObj, null, 2);

    const fullPrompt = `${prompt}

IMPORTANT: Your response MUST be a JSON object with EXACTLY this structure and camelCase field names.
DO NOT rename, snake_case, or abbreviate any fields — use this template exactly:
${exampleJson}

Fill the template with real data based on the task above.
Return ONLY the raw JSON — no markdown, no explanation.`;

    const response = await client.chat.completions.create({
        model,
        messages:        [{ role: "user", content: fullPrompt }],
        response_format: { type: "json_object" },
        temperature:     0.3,
    });

    const parsed = safeJsonParse(response.choices[0]?.message?.content);
    if (!parsed) {
        console.error(`[AI] ${model} raw:`, response.choices[0]?.message?.content?.slice(0, 500));
        throw new Error(`${model} returned invalid JSON`);
    }

    // Coerce each top-level field to the expected type so React never receives
    // an object where it expects a string (prevents "Objects are not valid as React child")
    const coerced = coerceToSchema(parsed, jsonSchema);
    console.log(`[AI] ${model} OK — keys: ${Object.keys(coerced).join(", ")}`);
    return coerced;
}

/* ─────────────────────────────────────────────────────────────────────────────
   UNIFIED AI CALLER  — with full fallback chain
   Priority: Gemini (responseSchema enforces exact fields) → Groq → OpenAI
   If the first provider fails for any reason, the next one is tried.
───────────────────────────────────────────────────────────────────────────── */
async function callAI(prompt, schema) {
    // Build the ordered provider list based on which keys are present
    const providers = [];

    // 1. Gemini first — native responseSchema guarantees correct field names
    if (process.env.GOOGLE_GENAI_API_KEY) {
        providers.push({ name: "Gemini", fn: () => callGemini(prompt, schema) });
    }
    // 2. Groq — fast, free tier, OpenAI-compatible
    if (process.env.GROQ_API_KEY) {
        providers.push({ name: "Groq", fn: () => callOpenAICompatible(getGroq(), GROQ_MODEL, prompt, schema) });
    }
    // 3. OpenAI — paid, highest accuracy
    if (process.env.OPENAI_API_KEY) {
        providers.push({ name: "OpenAI", fn: () => callOpenAICompatible(getOpenAI(), OPENAI_MODEL, prompt, schema) });
    }

    if (providers.length === 0) {
        throw new Error("No AI key configured. Add GROQ_API_KEY, OPENAI_API_KEY, or GOOGLE_GENAI_API_KEY to .env");
    }

    const errors = [];
    for (const { name, fn } of providers) {
        try {
            return await fn();
        } catch (err) {
            console.warn(`[AI] ${name} failed — ${err.message}`);
            errors.push(`${name}: ${err.message}`);
        }
    }

    throw new Error(`All AI providers failed. ${errors.join("; ")}`);
}

/* ─────────────────────────────────────────────────────────────────────────────
   YOUTUBE DATA API v3 HELPER
   Called only when the user supplies their own YouTube API key.
   Free tier: 10 000 units/day · each search = 100 units → ~100 searches/day
───────────────────────────────────────────────────────────────────────────── */
async function searchYouTube(query, youtubeApiKey, maxResults = 3) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("key", youtubeApiKey);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("videoCategoryId", "27"); // Education

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `YouTube API error ${res.status}`);
    }

    const data = await res.json();
    return (data.items || []).map((item) => ({
        title:       item.snippet.title,
        platform:    "YouTube",
        url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail:   item.snippet.thumbnails?.medium?.url || "",
        type:        "video",
        level:       "beginner",
        description: (item.snippet.description || "").slice(0, 200),
        channelName: item.snippet.channelTitle,
    }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. REAL-TIME JOB SKILL TREND ANALYZER
   Data:  Remotive free public API (no key required)
   AI:    Groq / OpenAI / Gemini
───────────────────────────────────────────────────────────────────────────── */
async function analyzeJobSkillTrends({ jobTitle, resume }) {
    // Fetch live job listings from Remotive (free, no auth)
    let jobs = [];
    try {
        const res = await fetch(
            `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(jobTitle)}&limit=20`,
            { signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) jobs = ((await res.json()).jobs || []).slice(0, 12);
    } catch { /* fall through — AI uses training knowledge */ }

    // Strip HTML tags; truncate to stay within token budget
    const descriptions = jobs
        .map((j) => j.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 800))
        .filter(Boolean)
        .join("\n---\n");

    const schema = z.object({
        skillFrequency: z.array(z.object({
            skill:     z.string().describe("Skill or technology name"),
            frequency: z.number().describe("Frequency across listings, or estimated importance 1-10"),
            category:  z.enum(["technical", "soft", "tools", "frameworks", "cloud"]),
            trend:     z.enum(["rising", "stable", "declining"]),
        })),
        resumeMatchedSkills:  z.array(z.string()),
        resumeMissingSkills:  z.array(z.string()),
        marketInsight:        z.string().describe("2-3 sentence market insight for this role"),
        topSkillsToLearn:     z.array(z.string()).describe("Top 5 skills to prioritize"),
    });

    const prompt = `You are a job market analyst. Analyze job descriptions for the role "${jobTitle}".

${descriptions
    ? `Live listings (${jobs.length}):\n${descriptions}`
    : `No live data — use your training knowledge for the "${jobTitle}" market (2024-2025).`}
${resume ? `\nCandidate Resume:\n${resume.slice(0, 1500)}` : ""}

Extract all skills, compute frequency, categorize, assign trend (rising/stable/declining).
If resume provided, identify matched and missing skills. Give market insight.`;

    const result = await callAI(prompt, schema);
    return { ...result, jobsAnalyzed: jobs.length, source: "Remotive" };
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. GITHUB PROFILE ANALYZER
   Data:  GitHub REST API (free; optional token for 5 000 req/hr)
   AI:    Groq / OpenAI / Gemini
───────────────────────────────────────────────────────────────────────────── */
async function analyzeGithubProfile({ username, jobDescription, githubToken }) {
    const headers = {
        "User-Agent": "career-prep-app/1.0",
        Accept: "application/vnd.github.v3+json",
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    };

    const [profileRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`, { headers }),
    ]);

    if (!profileRes.ok) {
        if (profileRes.status === 404) throw new Error(`GitHub user "${username}" not found`);
        if (profileRes.status === 403) throw new Error("GitHub rate limit exceeded. Add a GitHub token to raise the limit.");
        throw new Error("Failed to fetch GitHub profile");
    }

    const profile  = await profileRes.json();
    const allRepos = reposRes.ok ? await reposRes.json() : [];

    // Exclude forks; keep top 15 most recently updated
    const repos = allRepos
        .filter((r) => !r.fork && r.description !== null)
        .slice(0, 15)
        .map((r) => ({ name: r.name, description: r.description || "", language: r.language || "Unknown", stars: r.stargazers_count, topics: r.topics || [] }));

    const schema = z.object({
        topLanguages: z.array(z.object({
            language:         z.string(),
            projectCount:     z.number(),
            proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]),
        })),
        projectHighlights: z.array(z.object({
            name:           z.string(),
            description:    z.string(),
            relevanceScore: z.number().describe("0-100 relevance to the JD"),
            whyRelevant:    z.string(),
        })),
        overallMatchScore: z.number().describe("0-100"),
        strengthAreas:     z.array(z.string()),
        profileGaps:       z.array(z.string()),
        recommendation:    z.string().describe("3-4 sentences on portfolio improvements"),
        portfolioScore:    z.number().describe("0-100 portfolio quality"),
    });

    const prompt = `Analyze this GitHub profile for job compatibility.

Profile: ${JSON.stringify({ name: profile.name, bio: profile.bio, publicRepos: profile.public_repos, followers: profile.followers })}
Repos (${repos.length}): ${JSON.stringify(repos)}
${jobDescription ? `Job Description:\n${jobDescription.slice(0, 1500)}` : "Evaluate general quality."}

Analyze languages + proficiency, highlight relevant projects with relevance score, compute overall match + portfolio score, identify strengths and gaps, give actionable advice.`;

    const result = await callAI(prompt, schema);
    return {
        ...result,
        profile: {
            username: profile.login, name: profile.name, bio: profile.bio,
            avatarUrl: profile.avatar_url, publicRepos: profile.public_repos,
            followers: profile.followers, profileUrl: profile.html_url,
        },
        totalReposAnalyzed: repos.length,
        usedToken: Boolean(githubToken),
    };
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. DYNAMIC INTERVIEW QUESTION GENERATOR
   Modes: initial (resume+JD) or follow-up (previousQ + userAnswer)
   AI:    Groq / OpenAI / Gemini
───────────────────────────────────────────────────────────────────────────── */
async function generateDynamicQuestions({ resume, jobDescription, previousQuestion, userAnswer }) {
    const isFollowUp = Boolean(previousQuestion && userAnswer);

    const schema = z.object({
        questions: z.array(z.object({
            question:   z.string(),
            type:       z.enum(["technical", "behavioral", "situational", "competency"]),
            difficulty: z.enum(["easy", "medium", "hard"]),
            whyAsked:   z.string().describe("Why an interviewer asks this question"),
            hint:       z.string().describe("Key points to cover in the answer"),
        })),
        interviewTip: z.string().describe("One actionable tip for the interview"),
    });

    const prompt = isFollowUp
        ? `Generate 3 smart follow-up interview questions.

Previous Question: ${previousQuestion}
Candidate Answer: ${userAnswer}
Job Context: ${jobDescription ? jobDescription.slice(0, 800) : "Not provided"}

Follow-ups should probe weak points, explore related areas, or test deeper understanding.`
        : `Generate 10 highly relevant interview questions.

Resume: ${resume ? resume.slice(0, 1500) : "Not provided"}
Job Description: ${jobDescription ? jobDescription.slice(0, 1500) : "Not provided"}

Mix: technical (4), behavioral (3), situational (2), competency (1). Difficulty: 3 easy, 4 medium, 3 hard. Be specific to the candidate, not generic.`;

    return callAI(prompt, schema);
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. LEARNING RESOURCE FINDER
   Branch A (youtubeApiKey provided): real YouTube Data API v3 search per skill
   Branch B (no key): AI curates well-known free resources
   AI:    Groq / OpenAI / Gemini
───────────────────────────────────────────────────────────────────────────── */
async function findLearningResources({ skills, jobDescription, youtubeApiKey }) {
    const skillList   = Array.isArray(skills) ? skills : [String(skills)];
    const skillString = skillList.join(", ");

    // ── Branch A: real YouTube search ────────────────────────────────────────
    if (youtubeApiKey) {
        // Search YouTube for each skill in parallel
        const youtubeResultsBySkill = await Promise.all(
            skillList.map(async (skill) => {
                try {
                    const videos = await searchYouTube(
                        `${skill} tutorial beginners complete course`, youtubeApiKey, 3
                    );
                    return { skill, videos };
                } catch (err) {
                    console.warn(`[YouTube] "${skill}" failed: ${err.message}`);
                    return { skill, videos: [] };
                }
            })
        );

        // Supplement real YouTube results with non-YouTube free resources via AI
        const supplementSchema = z.object({
            skillResources: z.array(z.object({
                skill:          z.string(),
                estimatedHours: z.number(),
                extraResources: z.array(z.object({
                    title:       z.string(),
                    platform:    z.string(),
                    url:         z.string(),
                    type:        z.enum(["course", "documentation", "article", "interactive"]),
                    level:       z.enum(["beginner", "intermediate", "advanced"]),
                    description: z.string(),
                })),
            })),
            suggestedLearningPath: z.array(z.object({ week: z.number(), focus: z.string(), skills: z.array(z.string()) })),
            totalEstimatedWeeks: z.number(),
        });

        const supplement = await callAI(
            `Recommend the best FREE non-YouTube resources for each skill.

Skills: ${skillString}
${jobDescription ? `Role context: ${jobDescription.slice(0, 400)}` : ""}

Include: freeCodeCamp.org, MDN Web Docs, official documentation, Coursera free audit, interactive platforms.
ONLY free resources. Real, accurate URLs. Include week-by-week learning path.`,
            supplementSchema
        );

        // Merge YouTube videos into supplemental data
        const mergedSkillResources = supplement.skillResources.map((sr) => {
            const ytEntry = youtubeResultsBySkill.find((yt) => yt.skill === sr.skill);
            return {
                skill:          sr.skill,
                estimatedHours: sr.estimatedHours,
                resources:      [...(ytEntry?.videos || []), ...(sr.extraResources || [])],
            };
        });

        return {
            skillResources:        mergedSkillResources,
            suggestedLearningPath: supplement.suggestedLearningPath,
            totalEstimatedWeeks:   supplement.totalEstimatedWeeks,
            youtubeApiUsed:        true,
        };
    }

    // ── Branch B: AI-curated resources only ─────────────────────────────────
    const schema = z.object({
        skillResources: z.array(z.object({
            skill:          z.string(),
            estimatedHours: z.number(),
            resources: z.array(z.object({
                title:       z.string(),
                platform:    z.string().describe("e.g. YouTube, freeCodeCamp, MDN, Coursera, Official Docs"),
                url:         z.string().describe("Real, accurate URL"),
                type:        z.enum(["video", "course", "documentation", "article", "interactive"]),
                level:       z.enum(["beginner", "intermediate", "advanced"]),
                description: z.string(),
            })),
        })),
        suggestedLearningPath: z.array(z.object({ week: z.number(), focus: z.string(), skills: z.array(z.string()) })),
        totalEstimatedWeeks: z.number(),
    });

    const result = await callAI(
        `Recommend the best FREE learning resources for each skill.

Skills: ${skillString}
${jobDescription ? `Role context: ${jobDescription.slice(0, 600)}` : ""}

For each skill: 3-4 resources from well-known FREE sources:
- YouTube: Fireship, Traversy Media, CS Dojo, The Net Ninja, freeCodeCamp channel
- freeCodeCamp.org courses
- MDN Web Docs (web technologies)
- Official documentation
- Coursera free audit

ONLY free resources. Provide accurate, real URLs. Include week-by-week learning path.`,
        schema
    );
    return { ...result, youtubeApiUsed: false };
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. RESUME KEYWORD MATCHING ENGINE
   AI:    Groq / OpenAI / Gemini
───────────────────────────────────────────────────────────────────────────── */
async function matchResumeKeywords({ resume, jobDescription }) {
    const schema = z.object({
        overallMatchScore: z.number().describe("0-100 keyword match percentage"),
        atsScore:          z.number().describe("0-100 ATS compatibility score"),
        keywords: z.array(z.object({
            keyword:       z.string(),
            importance:    z.enum(["critical", "important", "nice-to-have"]),
            inResume:      z.boolean(),
            resumeContext: z.string().describe("Where it appears in resume, or 'Missing'"),
            suggestion:    z.string().describe("How to naturally incorporate this keyword"),
        })),
        missingCriticalKeywords: z.array(z.string()),
        strongKeywords:          z.array(z.string()),
        improvementSuggestions:  z.array(z.string()),
        summaryInsight:          z.string().describe("2-3 sentence summary"),
    });

    return callAI(
        `Perform a comprehensive ATS keyword analysis.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Extract all important JD keywords (skills, tools, certifications, soft skills, action verbs, industry terms).
Check each against the resume. Rate: critical / important / nice-to-have.
Compute match score (0-100) and ATS compatibility score (0-100).
List missing critical keywords with natural incorporation suggestions.
Identify strong keyword matches.`,
        schema
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. INTERVIEW ANSWER EVALUATOR
   AI:    Groq / OpenAI / Gemini
───────────────────────────────────────────────────────────────────────────── */
async function evaluateInterviewAnswer({ question, answer, jobDescription }) {
    const schema = z.object({
        overallScore: z.number().describe("0-100 overall quality"),
        grade:        z.enum(["Excellent", "Good", "Average", "Needs Work", "Poor"]),
        dimensionScores: z.object({
            communication: z.number().describe("0-100: clarity, structure, conciseness"),
            relevance:     z.number().describe("0-100: how well the answer addresses the question"),
            depth:         z.number().describe("0-100: technical or conceptual depth"),
            specificity:   z.number().describe("0-100: use of concrete examples and data"),
        }),
        strengths:         z.array(z.string()).describe("3-5 things done well"),
        improvements:      z.array(z.string()).describe("3-5 specific improvement areas"),
        idealAnswer:       z.string().describe("A comprehensive model answer"),
        starFormatUsed:    z.boolean().describe("Whether STAR format was used (behavioral Qs)"),
        followUpQuestions: z.array(z.string()).describe("2 follow-up questions an interviewer would ask"),
    });

    return callAI(
        `You are an expert interview coach. Evaluate this interview answer.

Question: ${question}
Candidate's Answer: ${answer}
${jobDescription ? `Job Context: ${jobDescription.slice(0, 600)}` : ""}

Provide: overall score (0-100), grade, dimension scores (communication/relevance/depth/specificity each 0-100), 3-5 strengths, 3-5 improvements, comprehensive ideal answer, STAR format check, 2 follow-up questions.`,
        schema
    );
}

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
    analyzeJobSkillTrends,
    analyzeGithubProfile,
    generateDynamicQuestions,
    findLearningResources,
    matchResumeKeywords,
    evaluateInterviewAnswer,
};
