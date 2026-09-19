import { defineHandler } from "nitro";
import { pool } from "../../../utils/db";

export default defineHandler(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CustomTemplate" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "bgUrl" TEXT NOT NULL,
        config JSONB NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    const result = await pool.query('SELECT * FROM "CustomTemplate" ORDER BY "createdAt" DESC');
    
    return result.rows.map(row => ({
      id: `db_${row.id}`,
      name: row.name,
      bgUrl: row.bgUrl,
      ...row.config
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
});
