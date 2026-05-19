import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { complaintsRouter } from './routes/complaints';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    process.env.FRONTEND_URL || 'https://veenu439-sudo.github.io' // Replace with your actual GitHub Pages URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api', complaintsRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
