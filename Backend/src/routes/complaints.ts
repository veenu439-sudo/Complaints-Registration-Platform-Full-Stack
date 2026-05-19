import { Router, Request, Response } from 'express';
import { db } from '../db';
import { complaints, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware } from './auth';

export const complaintsRouter = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

complaintsRouter.post('/ai/question', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { complaint_text } = req.body;
        if (!complaint_text) return res.status(400).json({ error: 'Complaint text is required' });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `Based on the following complaint, generate exactly ONE short, relevant follow-up question to ask the user to gather more useful information about their issue. Do not include any other text, just the question.\n\nComplaint: "${complaint_text}"`;
        
        const result = await model.generateContent(prompt);
        const question = result.response.text().trim();

        res.json({ question });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

complaintsRouter.post('/complaints', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { complaint_text, ai_question, user_answer } = req.body;
        const user = (req as any).user;

        const newComplaint = await db.insert(complaints).values({
            user_id: user.id,
            complaint_text,
            ai_question,
            user_answer
        }).returning();

        res.json(newComplaint[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

complaintsRouter.get('/complaints/my', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const myComplaints = await db.select().from(complaints)
            .where(eq(complaints.user_id, user.id))
            .orderBy(desc(complaints.created_at));

        res.json(myComplaints);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

complaintsRouter.get('/admin/complaints', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const allComplaints = await db.select({
            id: complaints.id,
            complaint_text: complaints.complaint_text,
            ai_question: complaints.ai_question,
            user_answer: complaints.user_answer,
            created_at: complaints.created_at,
            user_name: users.name,
            user_email: users.email
        }).from(complaints)
        .leftJoin(users, eq(complaints.user_id, users.id))
        .orderBy(desc(complaints.created_at));

        res.json(allComplaints);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
