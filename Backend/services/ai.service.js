const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

function safeJsonParse(text) {
    if (!text || typeof text !== "string") {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (_err) {
        const cleaned = text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        try {
            return JSON.parse(cleaned);
        } catch (_err2) {
            return null;
        }
    }
}

function toQuestionArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
            question: String(item.question || "").trim(),
            intention: String(item.intention || "").trim(),
            answer: String(item.answer || "").trim()
        }))
        .filter((item) => item.question && item.intention && item.answer);
}

function toSkillGaps(value) {
    const severities = new Set([ "low", "medium", "high" ]);

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => item && typeof item === "object")
        .map((item) => {
            const rawSeverity = String(item.severity || "").toLowerCase().trim();
            return {
                skill: String(item.skill || "").trim(),
                severity: severities.has(rawSeverity) ? rawSeverity : "medium"
            };
        })
        .filter((item) => item.skill);
}

function toPreparationPlan(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => item && typeof item === "object")
        .map((item, index) => {
            const parsedDay = Number(item.day);
            return {
                day: Number.isFinite(parsedDay) && parsedDay > 0 ? parsedDay : index + 1,
                focus: String(item.focus || "").trim(),
                tasks: Array.isArray(item.tasks)
                    ? item.tasks.map((task) => String(task || "").trim()).filter(Boolean)
                    : []
            };
        })
        .filter((item) => item.focus && item.tasks.length > 0);
}

function normalizeInterviewReport(raw, jobDescription) {
    const parsedScore = Number(raw?.matchScore);
    const matchScore = Number.isFinite(parsedScore)
        ? Math.max(0, Math.min(100, Math.round(parsedScore)))
        : 0;

    const technicalQuestions = toQuestionArray(raw?.technicalQuestions);
    const behavioralQuestions = toQuestionArray(raw?.behavioralQuestions);
    const skillGaps = toSkillGaps(raw?.skillGaps);
    const preparationPlan = toPreparationPlan(raw?.preparationPlan);

    let title = String(raw?.title || "").trim();
    if (!title) {
        title = String(jobDescription || "").split("\n")[ 0 ]?.slice(0, 100).trim() || "Interview Report";
    }

    return {
        title,
        matchScore,
        technicalQuestions,
        behavioralQuestions,
        skillGaps,
        preparationPlan
    };
}

function hasMeaningfulInterviewContent(report) {
    if (!report) {
        return false;
    }

    return (
        report.matchScore > 0
        || report.technicalQuestions.length > 0
        || report.behavioralQuestions.length > 0
        || report.skillGaps.length > 0
        || report.preparationPlan.length > 0
    );
}




const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})



async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error("Missing GOOGLE_GENAI_API_KEY");
    }


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    const parsedResponse = safeJsonParse(response.text)

    if (!parsedResponse) {
        throw new Error("AI returned invalid JSON response");
    }

    let normalizedReport = normalizeInterviewReport(parsedResponse, jobDescription)

    if (hasMeaningfulInterviewContent(normalizedReport)) {
        return normalizedReport
    }

    const fallbackPrompt = `Generate a detailed interview report JSON for this candidate. Return ONLY valid JSON with no markdown, no extra text.
JSON shape:
{
  "matchScore": number from 0 to 100,
  "technicalQuestions": [{"question":"...","intention":"...","answer":"..."}] (at least 5 items),
  "behavioralQuestions": [{"question":"...","intention":"...","answer":"..."}] (at least 5 items),
  "skillGaps": [{"skill":"...","severity":"low|medium|high"}] (at least 3 items),
  "preparationPlan": [{"day":1,"focus":"...","tasks":["...","..."]}] (at least 7 days),
  "title": "..."
}

Candidate details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`

    const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fallbackPrompt
    })

    const fallbackParsed = safeJsonParse(fallbackResponse.text)
    if (!fallbackParsed) {
        throw new Error("AI returned invalid fallback response");
    }

    normalizedReport = normalizeInterviewReport(fallbackParsed, jobDescription)

    if (!hasMeaningfulInterviewContent(normalizedReport)) {
        throw new Error("AI report was empty. Please try again with more detailed input.")
    }

    return normalizedReport
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf };