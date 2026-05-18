import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

authRouter.post('/send-otp', async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

        const existingUser = await db.select().from(users).where(eq(users.email, email));

        if (existingUser.length > 0) {
            if (existingUser[0].is_verified) {
                return res.status(400).json({ error: 'Email already registered and verified.' });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (existingUser.length === 0) {
            await db.insert(users).values({ name, email, otp, otp_expiry, is_verified: false });
        } else {
            await db.update(users).set({ name, otp, otp_expiry }).where(eq(users.email, email));
        }

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your Registration OTP',
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
        console.log(error);
    }
});

authRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) return res.status(400).json({ error: 'Missing fields' });

        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = existingUser[0];
        if (user.is_verified) return res.status(400).json({ error: 'User already verified' });

        if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(user.otp_expiry!)) return res.status(400).json({ error: 'OTP expired' });

        await db.update(users)
            .set({ password, is_verified: true, otp: null, otp_expiry: null })
            .where(eq(users.email, email));

        res.json({ message: 'Registration successful' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

authRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const existingUser = await db.select().from(users).where(eq(users.email, email));

        if (existingUser.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = existingUser[0];
        if (!user.is_verified) return res.status(401).json({ error: 'Please verify your account first' });
        if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ name: user.name, email: user.email, role: user.role });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

authRouter.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

export const authMiddleware = (req: Request, res: Response, next: any) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

authRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
    res.json((req as any).user);
});
