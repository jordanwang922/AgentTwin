import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sqlDir = path.resolve("infra/sql");
const sqlFiles = ["001_init.sql", "002_seed_demo.sql", "003_agenttwin_state.sql", "004_sop_domain.sql"].map((file) =>
  path.join(sqlDir, file)
);
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();

  for (const file of sqlFiles) {
    const sql = fs.readFileSync(file, "utf8");
    await client.query(sql);
    console.log(`Applied ${path.basename(file)}`);
  }

  console.log("PostgreSQL bootstrap completed.");
} finally {
  await client.end();
}
