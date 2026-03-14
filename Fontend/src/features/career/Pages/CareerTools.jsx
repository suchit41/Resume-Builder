/* ─────────────────────────────────────────────────────────────────────────────
   CareerTools.jsx
   Main page for the 6 AI-powered career enhancement tools.

   Layout:
   ┌──────────────────────────────────┬─────────────────┐
   │  Tool Content (active component) │  Right Nav Bar  │
   └──────────────────────────────────┴─────────────────┘

   The right nav is sticky and always visible.
   Each nav item maps to one of the 6 feature components.
───────────────────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/career.scss";

// ── Lazy-import the 6 feature components ────────────────────────────────────
import SkillTrendAnalyzer from "../components/SkillTrendAnalyzer";
import GitHubAnalyzer      from "../components/GitHubAnalyzer";
import QuestionGenerator   from "../components/QuestionGenerator";
import LearningFinder      from "../components/LearningFinder";
import KeywordMatcher      from "../components/KeywordMatcher";
import AnswerEvaluator     from "../components/AnswerEvaluator";

/* ── Tool Registry ────────────────────────────────────────────────────────────
   Each entry defines:
   - id:          unique key used to track the active tool
   - label:       text shown in the right nav
   - icon:        emoji icon shown in the nav
   - description: short subtitle shown in the nav tooltip / page header
   - component:   the React component to render when active
────────────────────────────────────────────────────────────────────────────── */
const TOOLS = [
    {
        id: "skill-trends",
        label: "Skill Trends",
        icon: "📊",
        description: "Live job market skill analysis",
        component: <SkillTrendAnalyzer />,
    },
    {
        id: "github",
        label: "GitHub Analyzer",
        icon: "🐙",
        description: "Profile & repo match against JD",
        component: <GitHubAnalyzer />,
    },
    {
        id: "questions",
        label: "Questions",
        icon: "🤔",
        description: "Dynamic interview question generator",
        component: <QuestionGenerator />,
    },
    {
        id: "learning",
        label: "Learning Finder",
        icon: "📚",
        description: "Free tutorials for missing skills",
        component: <LearningFinder />,
    },
    {
        id: "keywords",
        label: "Keyword Match",
        icon: "🔍",
        description: "ATS keyword gap analysis",
        component: <KeywordMatcher />,
    },
    {
        id: "evaluator",
        label: "Answer Evaluator",
        icon: "🎯",
        description: "Score & improve your answers",
        component: <AnswerEvaluator />,
    },
];

// ── Main Page Component ───────────────────────────────────────────────────────
const CareerTools = () => {
    // Track which tool is currently displayed in the content area
    const [activeTool, setActiveTool] = useState(TOOLS[0].id);

    // Find the full tool definition for the active id
    const currentTool = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];

    return (
        <div className="career-page">

            {/* ── Main Content Area ──────────────────────────────────────────── */}
            <div className="career-page__content">

                {/* Page header — updates when tool changes */}
                <div className="career-header">
                    <h1>
                        {currentTool.icon}&nbsp;
                        <span>{currentTool.label}</span>
                    </h1>
                    <p>{currentTool.description}</p>
                </div>

                {/* Render only the active tool's component */}
                {currentTool.component}
            </div>

            {/* ── Right Navigation Bar ───────────────────────────────────────── */}
            <aside className="career-page__nav">
                <nav className="career-nav">

                    {/* Back link to the main home page */}
                    <Link to="/" className="career-nav__brand">
                        {/* Back arrow icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Back to Interview Prep
                    </Link>

                    {/* Section label */}
                    <p className="career-nav__label">Career Tools</p>

                    {/* Tool nav buttons */}
                    {TOOLS.map((tool) => (
                        <button
                            key={tool.id}
                            className={`career-nav__item ${activeTool === tool.id ? "career-nav__item--active" : ""}`}
                            onClick={() => setActiveTool(tool.id)}
                            title={tool.description}
                        >
                            {/* Emoji icon */}
                            <span className="career-nav__item-icon">{tool.icon}</span>

                            {/* Label */}
                            {tool.label}

                            {/* Active indicator dot */}
                            <span className="career-nav__item-dot" />
                        </button>
                    ))}

                    {/* Divider */}
                    <div style={{ borderTop: "1px solid #2a3245", margin: "0.75rem 0" }} />

                    {/* Footer hint */}
                    <p style={{ fontSize: "0.72rem", color: "#4c566a", padding: "0 0.75rem", lineHeight: 1.5 }}>
                        All tools are powered by AI and use only free, open data sources.
                    </p>
                </nav>
            </aside>
        </div>
    );
};

export default CareerTools;
