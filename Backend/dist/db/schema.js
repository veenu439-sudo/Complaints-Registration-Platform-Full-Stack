"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaints = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)('password'), // plain text as requested
    role: (0, pg_core_1.varchar)('role', { length: 50 }).notNull().default('user'), // 'user' or 'admin'
    otp: (0, pg_core_1.varchar)('otp', { length: 10 }),
    otp_expiry: (0, pg_core_1.timestamp)('otp_expiry'),
    is_verified: (0, pg_core_1.boolean)('is_verified').default(false),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.complaints = (0, pg_core_1.pgTable)('complaints', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    user_id: (0, pg_core_1.integer)('user_id').references(() => exports.users.id),
    complaint_text: (0, pg_core_1.text)('complaint_text').notNull(),
    ai_question: (0, pg_core_1.text)('ai_question'),
    user_answer: (0, pg_core_1.text)('user_answer'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
