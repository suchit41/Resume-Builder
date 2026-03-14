const interviewRouter = require('./routes/interview.route');
const featuresRouter = require('./routes/features.route');

const authRouter = require('./routes/auth.route');

const cors = require('cors');
const cookieParser = require('cookie-parser');

const express = require('express');
const app = express();
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        // Allow non-browser requests with no Origin header.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});

//body parser middleware to parse JSON request bodies
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/features', featuresRouter); // Career tools: skill trends, GitHub, questions, resources, keywords, evaluator

app.use((err, _req, res, _next) => {
    if (err?.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: err.message });
    }

    if (err?.message === 'Only PDF resume files are supported.') {
        return res.status(400).json({ message: err.message });
    }

    if (err?.name === 'MulterError') {
        if (err?.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Resume file size must be less than 5MB.' });
        }

        if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Unexpected upload field. Use resume as the file field name.' });
        }

        return res.status(400).json({ message: err.message || 'Invalid file upload.' });
    }

    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
});


module.exports = app;
