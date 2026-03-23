require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing!");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log("Initializing vector extension in PostgreSQL...");
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("Successfully ensured 'vector' extension is active.");
  } catch (error) {
    console.error("Failed to initialize vector extension.", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
