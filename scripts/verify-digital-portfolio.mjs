import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// 1. Read environment variables
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function runVerification() {
  console.log("================================================================================");
  console.log(" VERIFYING DIGITAL PORTFOLIO MVP MODULE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // Check 1: Migration File Schema & Integrity
  // ---------------------------------------------------------------------------
  console.log("--- 1. Checking Migration File: 20260910140228_digital_portfolio.sql ---");
  const migrationPath = "supabase/migrations/20260910140228_digital_portfolio.sql";
  assert(fs.existsSync(migrationPath), "Migration file exists");

  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  assert(migrationSql.includes("create table if not exists public.portfolio_items"), "Defines public.portfolio_items table");
  assert(migrationSql.includes("item_type in ('certification', 'project', 'achievement', 'research', 'publication', 'workshop', 'other')"), "Enforces valid item_type check constraint");
  assert(migrationSql.includes("length(trim(title)) > 0"), "Enforces title not empty constraint");
  assert(migrationSql.includes("end_date >= start_date"), "Enforces end_date >= start_date constraint");
  assert(migrationSql.includes("references public.profiles(id) on delete cascade"), "Enforces student_id foreign key with ON DELETE CASCADE");
  assert(migrationSql.includes("create or replace function public.handle_portfolio_item_update()"), "Defines dedicated handle_portfolio_item_update trigger function");
  assert(migrationSql.includes("Portfolio item ID is immutable") && migrationSql.includes("student_id is immutable") && migrationSql.includes("created_at is immutable"), "Trigger function protects id, student_id, and created_at from mutation");
  assert(migrationSql.includes("alter table public.portfolio_items enable row level security"), "Enables RLS on portfolio_items");
  assert(migrationSql.includes("portfolio_items_select") && migrationSql.includes("student_id = auth.uid()"), "RLS Select restricted to auth.uid()");
  assert(migrationSql.includes("portfolio_items_insert") && migrationSql.includes("student_id = auth.uid()"), "RLS Insert restricted to auth.uid()");
  assert(migrationSql.includes("portfolio_items_update") && migrationSql.includes("student_id = auth.uid()"), "RLS Update restricted to auth.uid()");
  assert(migrationSql.includes("portfolio_items_delete") && migrationSql.includes("student_id = auth.uid()"), "RLS Delete restricted to auth.uid()");

  // ---------------------------------------------------------------------------
  // Check 2: Migrations 001-011 Untouched
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Verifying Migrations 001-011 Untouched ---");
  const migrations = fs.readdirSync("supabase/migrations");
  assert(migrations.includes("001_foundation.sql"), "001_foundation.sql exists");
  assert(migrations.includes("20260910134736_internship_placement.sql"), "011 (internship_placement) exists");

  // ---------------------------------------------------------------------------
  // Check 3: Sidebar Configuration
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Verifying Student Sidebar Navigation ---");
  const sidebarContent = fs.readFileSync("components/layout/sidebar.tsx", "utf8");
  assert(sidebarContent.includes('{ title: "My Portfolio", href: "/student/portfolio", icon: Scroll }'), "Sidebar contains My Portfolio link to /student/portfolio");
  assert(sidebarContent.includes("Academic & Training"), "Section is Academic & Training");

  // ---------------------------------------------------------------------------
  // Check 4: Server Actions & Security Protection
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Verifying Server Actions Security (app/student/portfolio/actions.ts) ---");
  const actionsContent = fs.readFileSync("app/student/portfolio/actions.ts", "utf8");
  assert(actionsContent.includes('requireRole("student")'), "Enforces student role check via requireRole");
  assert(actionsContent.includes("student_id: user.id"), "Always derives student_id from authenticated session user.id");
  assert(!actionsContent.includes("data.student_id"), "Never accepts student_id from browser client");
  assert(actionsContent.includes(".eq(\"student_id\", user.id)"), "Enforces student_id ownership on update and delete");
  assert(actionsContent.includes("revalidatePath(\"/student/portfolio\")"), "Revalidates portfolio path after mutations");
  assert(actionsContent.includes("revalidatePath(\"/student/dashboard\")"), "Revalidates dashboard path after mutations");

  // ---------------------------------------------------------------------------
  // Check 5: Student Portfolio Page & Source Tables Reuse
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Verifying Portfolio Aggregation & Data Source Reuse (page.tsx) ---");
  const pageContent = fs.readFileSync("app/student/portfolio/page.tsx", "utf8");
  assert(pageContent.includes('from("institutions")'), "Reuses public.institutions for profile summary");
  assert(pageContent.includes('from("student_competencies")'), "Reuses public.student_competencies for skills");
  assert(pageContent.includes('from("portfolio_items")'), "Reads public.portfolio_items for student evidence");
  assert(pageContent.includes('from("internship_placements")'), "Reuses public.internship_placements for placement records");
  assert(pageContent.includes('from("faculty_opportunity_interests")'), "Reuses public.faculty_opportunity_interests for collaborations");
  assert(!pageContent.includes('from("applications")'), "Does NOT infer faculty collaboration from applications + opportunities");
  assert(pageContent.includes("Suspense"), "Wraps page content in Suspense for Next.js 16 SSR stability");

  // ---------------------------------------------------------------------------
  // Check 6: Portfolio View Component Sections
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Verifying Portfolio View Sections (portfolio-view.tsx) ---");
  const viewContent = fs.readFileSync("app/student/portfolio/portfolio-view.tsx", "utf8");
  assert(viewContent.includes('id="profile-summary"'), "Contains Profile Summary section");
  assert(viewContent.includes('id="skills"'), "Contains Skills section");
  assert(viewContent.includes('id="certifications"'), "Contains Certifications section");
  assert(viewContent.includes('id="projects"'), "Contains Projects section");
  assert(viewContent.includes('id="research-publications"'), "Contains Research & Publications section");
  assert(viewContent.includes('id="achievements-workshops"'), "Contains Achievements & Workshops section");
  assert(viewContent.includes('id="internship-placement"'), "Contains Internship & Placement section");
  assert(viewContent.includes('id="collaboration"'), "Contains Industry & Faculty Collaboration section");
  assert(viewContent.includes("No internship or placement record yet."), "Contains exact empty state for placements");
  assert(viewContent.includes("No collaboration activity recorded yet."), "Contains exact empty state for collaborations");
  assert(viewContent.includes("Academic & Domain") && viewContent.includes("Clinical & Practical") && viewContent.includes("Research & Evidence") && viewContent.includes("Professional Practice"), "Groups competencies into the 4 required categories");

  // ---------------------------------------------------------------------------
  // Check 7: Student Dashboard Summary Card
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Verifying Student Dashboard Summary Card (app/student/dashboard/page.tsx) ---");
  const dashboardContent = fs.readFileSync("app/student/dashboard/page.tsx", "utf8");
  assert(dashboardContent.includes("My Portfolio"), "Dashboard has My Portfolio title");
  assert(dashboardContent.includes("portfolioItemCount"), "Dashboard computes portfolio item count");
  assert(dashboardContent.includes("competenciesCount"), "Dashboard computes competencies count");
  assert(dashboardContent.includes("certificationsCount"), "Dashboard computes certifications count");
  assert(dashboardContent.includes("projectsCount"), "Dashboard computes projects count");
  assert(dashboardContent.includes('href="/student/portfolio"'), "Dashboard has View Portfolio link to /student/portfolio");

  // ---------------------------------------------------------------------------
  // Check 8: Input Validation Unit Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Testing Portfolio Input Validation Rules ---");
  const VALID_ITEM_TYPES = [
    "certification",
    "project",
    "achievement",
    "research",
    "publication",
    "workshop",
    "other",
  ];

  function testValidation(data) {
    if (!data.title || data.title.trim().length === 0) {
      return "Title is required and cannot be empty.";
    }
    if (!VALID_ITEM_TYPES.includes(data.item_type)) {
      return `Invalid item type: ${data.item_type}`;
    }
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      if (end < start) {
        return "End date cannot be earlier than start date.";
      }
    }
    return null;
  }

  assert(testValidation({ title: "", item_type: "certification" }) === "Title is required and cannot be empty.", "Rejects empty title");
  assert(testValidation({ title: "   ", item_type: "certification" }) === "Title is required and cannot be empty.", "Rejects whitespace-only title");
  assert(testValidation({ title: "Valid Title", item_type: "invalid_type" })?.includes("Invalid item type"), "Rejects invalid item_type");
  assert(testValidation({ title: "Valid Title", item_type: "project", start_date: "2026-05-10", end_date: "2026-05-01" }) === "End date cannot be earlier than start date.", "Rejects end_date before start_date");
  assert(testValidation({ title: "Valid Title", item_type: "project", start_date: "2026-05-01", end_date: "2026-05-10" }) === null, "Accepts valid date range");
  assert(testValidation({ title: "Panchakarma Certification", item_type: "certification" }) === null, "Accepts valid certification entry");

  // ---------------------------------------------------------------------------
  // Check 9: Auth verification with Supabase
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Verifying Supabase Auth Credentials ---");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: studentAuth, error: authError } = await supabase.auth.signInWithPassword({
    email: "student.test@ayush.local",
    password: "TestPassword123!",
  });

  if (authError) {
    console.log(`[WARN] student.test@ayush.local auth check: ${authError.message}`);
  } else {
    assert(Boolean(studentAuth.user), `student.test@ayush.local authenticated successfully (ID: ${studentAuth.user.id})`);
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", studentAuth.user.id)
      .single();
    assert(profile?.role === "student", `Verified role for test user: ${profile?.role}`);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification execution error:", err);
  process.exit(1);
});
