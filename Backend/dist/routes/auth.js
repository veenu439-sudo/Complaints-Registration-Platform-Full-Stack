"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.authRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.authRouter = (0, express_1.Router)();
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});
exports.authRouter.post('/send-otp', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email)
            return res.status(400).json({ error: 'Name and email are required' });
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length > 0) {
            if (existingUser[0].is_verified) {
                return res.status(400).json({ error: 'Email already registered and verified.' });
            }
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        if (existingUser.length === 0) {
            await db_1.db.insert(schema_1.users).values({ name, email, otp, otp_expiry, is_verified: false });
        }
        else {
            await db_1.db.update(schema_1.users).set({ name, otp, otp_expiry }).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        }
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your Registration OTP',
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`
        });
        res.json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.authRouter.post('/register', async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password)
            return res.status(400).json({ error: 'Missing fields' });
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length === 0)
            return res.status(404).json({ error: 'User not found' });
        const user = existingUser[0];
        if (user.is_verified)
            return res.status(400).json({ error: 'User already verified' });
        if (user.otp !== otp)
            return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(user.otp_expiry))
            return res.status(400).json({ error: 'OTP expired' });
        await db_1.db.update(schema_1.users)
            .set({ password, is_verified: true, otp: null, otp_expiry: null })
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        res.json({ message: 'Registration successful' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length === 0)
            return res.status(401).json({ error: 'Invalid credentials' });
        const user = existingUser[0];
        if (!user.is_verified)
            return res.status(401).json({ error: 'Please verify your account first' });
        if (user.password !== password)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ name: user.name, email: user.email, role: user.role });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.authRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});
const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
exports.authRouter.get('/me', exports.authMiddleware, (req, res) => {
    res.json(req.user);
});
