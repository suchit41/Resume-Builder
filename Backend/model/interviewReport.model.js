const mongoose = require("mongoose")



const technicalQuestionSchema = new mongoose.schema({
    question:{
        type: String,
        required: [true,"Question is required"]
    },
    intension:{
        type: String,
        required: [true,"Intension is required"]
    },
    answer:{
        type: String,
        required: [true,"Expected Answer is required"]
    },
},{
    _id : false
})


const BehavioralQuestionSchema = new mongoose.schema({
    question:{
        type: String,
        required: [true,"Question is required"]
    },
    intension:{
        type: String,
        required: [true,"Intension is required"]
    },
    answer:{
        type: String,
        required: [true,"Expected Answer is required"]
    },
},{
    _id : false
})   


const skillGapSchema= new mongose.schema({
    skill:{
        type: String,
        required: [true,"Skill is required"]
    },
    secerity:{
        type: String,
        enum :["Low","Medium","High"],
        required: [true,"Secerity is required"]
    }},{
        _id : false
});


const preprationPlanSchema = new mongoose.schema({
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


const interviewReportSchema = new mongoose.schema({

    jobDescription:{
        type: String,
        required: [true,"job Describtion is required"]
    },

    resume:{
        type: String,
    },
    selfDescribtion:
    {
        type: String,
        required: [true,"Self Describtion is needed"]
    },
    matchScore:
    {
        type: Number,
        min:0,
        max:100
    },
    technicalQuestion:[technicalQuestionSchema],
    behavioralQuestion:[BehavioralQuestionSchema],
    skillGap:[skillGapSchema],
    preprationPlan:[preprationPlanSchema],
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