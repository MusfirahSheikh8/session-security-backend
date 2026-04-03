import { Pool } from 'pg';

console.log("APP DB URL:", process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});