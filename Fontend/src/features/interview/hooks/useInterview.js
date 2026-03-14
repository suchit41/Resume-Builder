import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useCallback, useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

const EMPTY_REPORT = {
    matchScore: 0,
    technicalQuestions: [],
    behavioralQuestions: [],
    skillGaps: [],
    preparationPlan: [],
    title: "Interview Report"
}

const withDefaults = (report) => {
    if (!report || typeof report !== "object") {
        return null
    }

    return {
        ...EMPTY_REPORT,
        ...report,
        technicalQuestions: Array.isArray(report.technicalQuestions) ? report.technicalQuestions : [],
        behavioralQuestions: Array.isArray(report.behavioralQuestions) ? report.behavioralQuestions : [],
        skillGaps: Array.isArray(report.skillGaps) ? report.skillGaps : [],
        preparationPlan: Array.isArray(report.preparationPlan) ? report.preparationPlan : []
    }
}

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(withDefaults(response?.interviewReport))
        } catch (error) {
            console.log(error)
            window.alert(error?.userMessage || "Failed to generate interview report.")
        } finally {
            setLoading(false)
        }

        return withDefaults(response?.interviewReport)
    }

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(withDefaults(response?.interviewReport))
        } catch (error) {
            console.log(error)
            setReport(null)
        } finally {
            setLoading(false)
        }
        return withDefaults(response?.interviewReport)
    }, [setLoading, setReport])

    const getReports = useCallback(async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response?.interviewReports ?? [])
        } catch (error) {
            console.log(error)
            setReports([])
        } finally {
            setLoading(false)
        }

        return response?.interviewReports
    }, [setLoading, setReports])
// for download the resume pdf generated based on user self description, resume content and job description.
    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, getReportById, getReports ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}