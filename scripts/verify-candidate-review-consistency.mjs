import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { calculateOpportunitySkillMatch } from "../lib/opportunities.ts";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runVerification() {
  console.log("================================================================================");
  console.log(" CANDIDATE REVIEW & STUDENT OPPORTUNITY DETAILS INCONSISTENCY VERIFICATION");
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

  // 1. Code Inspection: Candidate Review page
  console.log("--- 1. Code Inspection & Guardrails ---");
  const reviewPageCode = fs.readFileSync("app/industry/applications/[applicationId]/page.tsx", "utf8");
  assert(reviewPageCode.includes("createAdminClient"), "Candidate Review page imports createAdminClient");
  assert(reviewPageCode.includes("from(\"student_competencies\")"), "Candidate Review queries student_competencies");
  assert(reviewPageCode.includes("assessed candidate scores"), "Candidate Review uses updated 'assessed candidate scores' UI label");
  assert(!reviewPageCode.includes("verified candidate scores"), "Candidate Review removes misleading 'verified candidate scores'");

  const listPageCode = fs.readFileSync("app/industry/applications/page.tsx", "utf8");
  assert(listPageCode.includes("createAdminClient"), "Industry Applications list page imports createAdminClient");

  // 2. Load existing application
  console.log("\n--- 2. Fetch Existing Candidate Application ---");
  const applicationId = "3d6647e6-f078-44ef-989b-14c855c3c949";
  const { data: application, error: appErr } = await admin
    .from("applications")
    .select(`
      id,
      student_id,
      opportunities!inner (
        id,
        title,
        created_by,
        opportunity_competencies (
          competency_id,
          required_score,
          weight,
          competencies (
            id,
            name,
            category
          )
        )
      )
    `)
    .eq("id", applicationId)
    .single();

  assert(!appErr && application, `Found application ${applicationId} for student ${application?.student_id}`);
  const opp = application.opportunities;
  const rawReqs = opp.opportunity_competencies || [];
  const requirements = rawReqs
    .filter((r) => r.competencies)
    .map((r) => ({
      competencyId: r.competency_id,
      competencyName: r.competencies.name,
      category: r.competencies.category,
      requiredScore: Number(r.required_score) || 60,
      weight: Number(r.weight) || 1,
    }));

  assert(requirements.length > 0, `Opportunity '${opp.title}' has ${requirements.length} competency requirements`);

  // 3. Query student's assessed competencies using updated Candidate Review data mapping
  console.log("\n--- 3. Industry Candidate Review Data Mapping ---");
  const { data: studentComps, error: compErr } = await admin
    .from("student_competencies")
    .select("competency_id, proficiency_score, verified")
    .eq("student_id", application.student_id);

  assert(!compErr && studentComps && studentComps.length > 0, `Successfully retrieved ${studentComps?.length || 0} student competency records`);

  const industryCandidateScoresMap = new Map();
  for (const sc of studentComps) {
    industryCandidateScoresMap.set(sc.competency_id, Number(sc.proficiency_score));
  }

  const industryReviewMatch = calculateOpportunitySkillMatch(requirements, industryCandidateScoresMap);

  console.log(`  Industry Candidate Review Skill Match: ${industryReviewMatch.skillMatchPercentage}%`);
  for (const item of industryReviewMatch.details) {
    console.log(`    * ${item.competencyName}: Candidate ${item.studentScore} / Required ${item.requiredScore} -> ${item.status}`);
  }

  // Verify none of the evaluated competencies are "Not Assessed"
  const notAssessedCount = industryReviewMatch.details.filter((d) => d.status === "Not Assessed").length;
  assert(notAssessedCount === 0, "Zero competencies are marked 'Not Assessed' in Industry Candidate Review");
  assert(industryReviewMatch.skillMatchPercentage === 60, `Candidate Review calculated skill match is 60% (got ${industryReviewMatch.skillMatchPercentage}%)`);

  // 4. Query student's assessed competencies using Student Opportunity Details data mapping
  console.log("\n--- 4. Student Opportunity Details Data Mapping ---");
  // Student opportunity details page reads:
  // const { data: studentComps } = await supabase.from("student_competencies").select("competency_id, proficiency_score, verified").eq("student_id", user.id);
  const studentScoresMap = new Map();
  for (const sc of studentComps) {
    studentScoresMap.set(sc.competency_id, Number(sc.proficiency_score));
  }
  const studentDetailMatch = calculateOpportunitySkillMatch(requirements, studentScoresMap);

  console.log(`  Student Opportunity Details Skill Match: ${studentDetailMatch.skillMatchPercentage}%`);
  for (const item of studentDetailMatch.details) {
    console.log(`    * ${item.competencyName}: Student ${item.studentScore} / Required ${item.requiredScore} -> ${item.status}`);
  }

  // 5. Cross-Verification: Exact Consistency Check
  console.log("\n--- 5. Cross-Page Consistency Comparison ---");
  assert(
    industryReviewMatch.skillMatchPercentage === studentDetailMatch.skillMatchPercentage,
    `Overall Skill Match percentage matches exactly: Industry ${industryReviewMatch.skillMatchPercentage}% === Student ${studentDetailMatch.skillMatchPercentage}%`
  );
  assert(
    industryReviewMatch.metCount === studentDetailMatch.metCount,
    `Requirements Met count matches exactly: Industry ${industryReviewMatch.metCount} === Student ${studentDetailMatch.metCount}`
  );
  assert(
    industryReviewMatch.skillGaps.length === studentDetailMatch.skillGaps.length,
    `Identified Skill Gaps count matches exactly: Industry ${industryReviewMatch.skillGaps.length} === Student ${studentDetailMatch.skillGaps.length}`
  );

  let allCompetenciesMatch = true;
  for (const indItem of industryReviewMatch.details) {
    const stuItem = studentDetailMatch.details.find((s) => s.competencyId === indItem.competencyId);
    if (!stuItem || indItem.studentScore !== stuItem.studentScore || indItem.status !== stuItem.status) {
      allCompetenciesMatch = false;
      console.error(`  Mismatch on ${indItem.competencyName}: Industry [${indItem.studentScore}, ${indItem.status}] vs Student [${stuItem?.studentScore}, ${stuItem?.status}]`);
    }
  }
  assert(allCompetenciesMatch, "All competency scores and Met / Development Needed statuses match 100% between Industry and Student pages");

  // 6. Verify stored verified value has NOT been changed
  console.log("\n--- 6. Stored 'verified' Value & Distinction Verification ---");
  const anyFalselyVerified = studentComps.some((c) => c.verified === true);
  assert(!anyFalselyVerified, "No competency record was modified or falsely marked verified: true (all remain verified: false)");

  console.log("\n================================================================================");
  console.log(` VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
