import 'dotenv/config';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env');
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });