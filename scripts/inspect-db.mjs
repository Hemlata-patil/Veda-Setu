import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: institutions, error: instErr } = await admin
    .from("institutions")
    .select("id, name, code, verification_status, category, location");

  console.log("Institutions:", JSON.stringify(institutions, null, 2));
  if (instErr) console.error("Error institutions:", instErr);

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, full_name, email, role, institution_id")
    .limit(5);

  console.log("Sample profiles:", JSON.stringify(profiles, null, 2));
  if (profErr) console.error("Error profiles:", profErr);
}

inspect();
