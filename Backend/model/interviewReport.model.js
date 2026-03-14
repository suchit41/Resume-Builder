const mongoose = require("mongoose")



const technicalQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required: [true,"Question is required"]
    },
    intention:{
        type: String,
        required: [true,"Intention is required"]
    },
    answer:{
        type: String,
        required: [true,"Expected Answer is required"]
    },
},{
    _id : false
})


const BehavioralQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required: [true,"Question is required"]
    },
    intention:{
        type: String,
        required: [true,"Intention is required"]
    },
    answer:{
        type: String,
        required: [true,"Expected Answer is required"]
    },
},{
    _id : false
})   


const skillGapSchema= new mongoose.Schema({
    skill:{
        type: String,
        required: [true,"Skill is required"]
    },
    severity:{
        type: String,
        enum :["low","medium","high"],
        required: [true,"Severity is required"]
    }},{
        _id : false
});


const preparationPlanSchema = new mongoose.Schema({
    day:{
        type: Number,
        required: [true,"Day is required"]  
    },
    focus:{
        type: String,
        required: [true,"Focus is required"]
    },
    tasks:
        [{
            type: String,
            required: [true,"Task is required"]
        }]
    
})


const interviewReportSchema = new mongoose.Schema({

    jobDescription:{
        type: String,
        required: [true,"job Describtion is required"]
    },

    resume:{
        type: String,
    },
    selfDescription:
    {
        type: String,
        default: ""
    },
    matchScore:
    {
        type: Number,
        min:0,
        max:100,
        default: 0
    },
    technicalQuestions:{
        type: [technicalQuestionSchema],
        default: []
    },
    behavioralQuestions:{
        type: [BehavioralQuestionSchema],
        default: []
    },
    skillGaps:{
        type: [skillGapSchema],
        default: []
    },
    preparationPlan:{
        type: [preparationPlanSchema],
        default: []
    },
    title: {
        type: String,
        default: "Untitled Position"
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true,"User is required to generate interview report"]   
    }
},
{

    timestamps: true
});


const interviewReportModel = mongoose.model("InterviewReport",interviewReportSchema);

module.exports = interviewReportModel;