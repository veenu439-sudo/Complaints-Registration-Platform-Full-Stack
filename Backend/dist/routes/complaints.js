"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const generative_ai_1 = require("@google/generative-ai");
const auth_1 = require("./auth");
exports.complaintsRouter = (0, express_1.Router)();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
exports.complaintsRouter.post('/ai/question', auth_1.authMiddleware, async (req, res) => {
    try {
        const { complaint_text } = req.body;
        if (!complaint_text)
            return res.status(400).json({ error: 'Complaint text is required' });
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const prompt = `Based on the following complaint, generate exactly ONE short, relevant follow-up question to ask the user to gather more useful information about their issue. Do not include any other text, just the question.\n\nComplaint: "${complaint_text}"`;
        const result = await model.generateContent(prompt);
        const question = result.response.text().trim();
        res.json({ question });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.complaintsRouter.post('/complaints', auth_1.authMiddleware, async (req, res) => {
    try {
        const { complaint_text, ai_question, user_answer } = req.body;
        const user = req.user;
        const newComplaint = await db_1.db.insert(schema_1.complaints).values({
            user_id: user.id,
            complaint_text,
            ai_question,
            user_answer
        }).returning();
        res.json(newComplaint[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.complaintsRouter.get('/complaints/my', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const myComplaints = await db_1.db.select().from(schema_1.complaints)
            .where((0, drizzle_orm_1.eq)(schema_1.complaints.user_id, user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.complaints.created_at));
        res.json(myComplaints);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.complaintsRouter.get('/admin/complaints', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const allComplaints = await db_1.db.select({
            id: schema_1.complaints.id,
            complaint_text: schema_1.complaints.complaint_text,
            ai_question: schema_1.complaints.ai_question,
            user_answer: schema_1.complaints.user_answer,
            created_at: schema_1.complaints.created_at,
            user_name: schema_1.users.name,
            user_email: schema_1.users.email
        }).from(schema_1.complaints)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.complaints.user_id, schema_1.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.complaints.created_at));
        res.json(allComplaints);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
