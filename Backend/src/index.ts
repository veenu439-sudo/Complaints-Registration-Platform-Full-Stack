import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { complaintsRouter } from './routes/complaints';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: true, // Allow frontend running on any port/origin
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
