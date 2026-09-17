import fs from "fs";
import path from "path";
import { pool } from "./index";

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.resolve(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found.");
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");
    console.log(`Executing migration: ${file}...`);
    try {
      await pool.query(sql);
      console.log(`Migration ${file} applied successfully.`);
    } catch (err: any) {
      console.error(`Failed to apply migration ${file}:`, err.message);
      throw err;
    }
  }
}

// Allow direct CLI execution: tsx src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("All migrations executed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration runner failed:", err);
      process.exit(1);
    });
}
