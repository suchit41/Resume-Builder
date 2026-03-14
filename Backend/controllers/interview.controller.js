const { PDFParse } = require("pdf-parse");
const interviewReportModel = require("../model/interviewReport.model");

const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");

async function extractPdfTextFromBuffer(pdfBuffer) {
    const parser = new PDFParse({ data: pdfBuffer });

    try {
        const textResult = await parser.getText();
        return String(textResult?.text || "").trim();
    } finally {
        if (typeof parser.destroy === "function") {
            await parser.destroy();
        }
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterviewReportController(req,res){
    try {
        const selfDescription = String(req.body?.selfDescription || "").trim();
        const jobDescription = String(req.body?.jobDescription || "").trim();
        const uploadedResume = req.file
            || req.files?.resume?.[ 0 ]
            || req.files?.resumeFile?.[ 0 ];

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required."
            });
        }

        let resumeText = "";
        if (uploadedResume?.buffer) {
            try {
                resumeText = await extractPdfTextFromBuffer(uploadedResume.buffer);
            } catch (_error) {
                return res.status(400).json({
                    message: "Could not read the uploaded resume. Please upload a valid PDF file."
                });
            }
        }

        if (uploadedResume && !resumeText && !selfDescription) {
            return res.status(400).json({
                message: "We could not extract text from this PDF resume. Please upload a text-based PDF or add a self description."
            });
        }

        if (!selfDescription && !resumeText) {
            return res.status(400).json({
                message: "Either selfDescription or a resume file is required."
            });
        }

        const InterviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        const interviewReport = await interviewReportModel.create({
            user:req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...InterviewReportByAi
         })

        return res.status(201).json({
            message:"Interview report generated successfully",
            interviewReport
        })
    } catch (error) {
        console.error("Error generating interview report:", error);
        return res.status(500).json({
            message: error?.message?.includes("GOOGLE_GENAI_API_KEY")
                ? "Interview service is not configured correctly. Please contact support."
                : "Failed to generate interview report. Please try again."
        });
    }
}


module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
