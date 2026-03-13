const interviewRouter = require('./routes/interview.route');

const authRouter = require('./routes/auth.route');

const cors = require('cors');

const express = require('express');
const app = express();
app.use(cors({
    origin:"http://localhost:5173",
    withCredentials:true
}));

//body parser middleware to parse JSON request bodies
app.use(express.json());
app.use('/api/auth',authRouter)
app.use('/api/interview',interviewRouter);


module.exports = app;
