import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is missing in environment variables');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
