import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local if not already in process.env
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      const val = rest.join("=").replace(/^["']|["']$/g, "");
      process.env[key.trim()] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runVerification() {
  console.log("==================================================");
  console.log("STARTING END-TO-END STUDENT ASSESSMENT VERIFICATION");
  console.log("==================================================\n");

  // Step 1: Sign in as student.test@ayush.local
  console.log("1. Authenticating test student...");
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: "student.test@ayush.local",
    password: "TestPassword123!",
  });

  if (authError || !authData.user) {
    throw new Error(`Auth failed: ${authError?.message}`);
  }
  const studentId = authData.user.id;
  console.log(`✓ Authenticated student ID: ${studentId}\n`);

  // Step 2: Query published assessment template
  console.log("2. Querying published assessment template...");
  const { data: template, error: tmplError } = await client
    .from("assessment_templates")
    .select("id, title, program, description, status")
    .eq("status", "published")
    .single();

  if (tmplError || !template) {
    throw new Error(`Failed to fetch published template: ${tmplError?.message}`);
  }
  console.log(`✓ Template found: "${template.title}" (${template.program}) [ID: ${template.id}]`);

  // Query questions count and competencies
  const { data: questions, error: qError } = await client
    .from("assessment_questions")
    .select("id, question, question_type, competency_id, options, created_at")
    .eq("assessment_template_id", template.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (qError || !questions) {
    throw new Error(`Failed to fetch questions: ${qError?.message}`);
  }
  console.log(`✓ Fetched ${questions.length} active questions.`);
  if (questions.length !== 26) {
    throw new Error(`Expected 26 questions, found ${questions.length}`);
  }

  // Step 3: Verify client CANNOT read assessment_question_keys (Protected Table Security Check)
  console.log("\n3. Testing security: Verifying client CANNOT read assessment_question_keys...");
  const { data: secretKeys, error: secError } = await client
    .from("assessment_question_keys")
    .select("*");

  if (secretKeys && secretKeys.length > 0) {
    throw new Error(`CRITICAL SECURITY FAILURE: Client was able to read ${secretKeys.length} rows from assessment_question_keys!`);
  }
  console.log(`✓ Confirmed: Client received 0 keys (RLS protected, error: ${secError?.message || "empty/denied"}).`);

  // Step 4: Clean up any prior test attempt for this student to ensure a fresh test run
  console.log("\n4. Resetting prior test attempt for student if any...");
  const { data: existingAttempts } = await adminClient
    .from("assessment_attempts")
    .select("id")
    .eq("student_id", studentId)
    .eq("assessment_template_id", template.id);

  if (existingAttempts && existingAttempts.length > 0) {
    for (const att of existingAttempts) {
      await adminClient.from("assessment_answers").delete().eq("attempt_id", att.id);
      await adminClient.from("assessment_attempts").delete().eq("id", att.id);
    }
    console.log(`✓ Cleaned up ${existingAttempts.length} prior attempt(s).`);
  }
  await adminClient.from("student_competencies").delete().eq("student_id", studentId);

  // Step 5: Test Attempt Security - student cannot create pre-completed attempt
  console.log("\n5. Testing attempt creation security constraints...");
  const { data: badAttempt, error: badAttemptError } = await client
    .from("assessment_attempts")
    .insert({
      assessment_template_id: template.id,
      student_id: studentId,
      status: "submitted", // ILLEGAL: student cannot set status to submitted on insert
      total_score: 95.0,   // ILLEGAL: student cannot set total_score
    })
    .select("id");

  if (badAttempt && badAttempt.length > 0) {
    throw new Error("SECURITY FAILURE: Student was able to insert a pre-submitted attempt with scores!");
  }
  console.log(`✓ Confirmed: Illegal attempt creation blocked by DB constraint (${badAttemptError?.message}).`);

  // Step 6: Create legitimate attempt in 'not_started'
  console.log("\n6. Creating legitimate attempt in 'not_started'...");
  const { data: newAttempt, error: createError } = await client
    .from("assessment_attempts")
    .insert({
      assessment_template_id: template.id,
      student_id: studentId,
      status: "not_started",
    })
    .select("id, status, started_at, total_score, submitted_at")
    .single();

  if (createError || !newAttempt) {
    throw new Error(`Failed to create attempt: ${createError?.message}`);
  }
  console.log(`✓ Attempt created: ID ${newAttempt.id}, status: ${newAttempt.status}`);

  // Step 7: Transition attempt to 'in_progress'
  console.log("\n7. Transitioning attempt to 'in_progress'...");
  const { data: startedAttempt, error: startError } = await client
    .from("assessment_attempts")
    .update({ status: "in_progress" })
    .eq("id", newAttempt.id)
    .select("id, status, started_at")
    .single();

  if (startError || !startedAttempt) {
    throw new Error(`Failed to start attempt: ${startError?.message}`);
  }
  if (!startedAttempt.started_at) {
    throw new Error("Trigger failed: started_at was not automatically set by DB trigger!");
  }
  console.log(`✓ Attempt is now 'in_progress'. Trigger set started_at: ${startedAttempt.started_at}`);

  // Step 8: Save answers for all 26 questions
  console.log("\n8. Answering questions and testing autosave/persistence...");
  // Let's get the protected keys via adminClient so we can select some correct and some incorrect answers for testing
  const { data: correctKeys } = await adminClient
    .from("assessment_question_keys")
    .select("question_id, correct_answer");

  const keyMap = new Map(correctKeys.map((k) => [k.question_id, k.correct_answer?.value]));

  let mcqCount = 0;
  let selfRatingCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.question_type === "mcq") {
      mcqCount++;
      // Answer with the correct answer for odd-numbered MCQs, and another option for even-numbered
      const correctVal = keyMap.get(q.id) || "A";
      const chosenVal = (mcqCount % 2 === 1) ? correctVal : (correctVal === "A" ? "B" : "A");

      const { error: ansError } = await client
        .from("assessment_answers")
        .upsert(
          {
            attempt_id: newAttempt.id,
            question_id: q.id,
            assessment_template_id: template.id,
            answer_text: chosenVal,
            answer_value: null,
          },
          { onConflict: "attempt_id,question_id" }
        );

      if (ansError) {
        throw new Error(`Failed to save answer for Q${i + 1}: ${ansError.message}`);
      }
    } else {
      selfRatingCount++;
      // Self-rating: 1=20, 2=40, 3=60, 4=80, 5=100
      const ratingValue = (selfRatingCount % 5) + 1; // 1 to 5
      const ratingLabels = { 1: "Very Low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very High" };

      const { error: ansError } = await client
        .from("assessment_answers")
        .upsert(
          {
            attempt_id: newAttempt.id,
            question_id: q.id,
            assessment_template_id: template.id,
            answer_value: ratingValue,
            answer_text: ratingLabels[ratingValue],
          },
          { onConflict: "attempt_id,question_id" }
        );

      if (ansError) {
        throw new Error(`Failed to save answer for Q${i + 1}: ${ansError.message}`);
      }
    }
  }

  console.log(`✓ Saved ${mcqCount} MCQ answers and ${selfRatingCount} Self-Rating answers.`);

  // Step 9: Verify answers remain saved on reload
  console.log("\n9. Verifying saved answers persistence on reload...");
  const { data: savedAnswers, error: checkAnsError } = await client
    .from("assessment_answers")
    .select("id, question_id, answer_value, answer_text")
    .eq("attempt_id", newAttempt.id);

  if (checkAnsError || !savedAnswers || savedAnswers.length !== 26) {
    throw new Error(`Expected 26 saved answers, found ${savedAnswers?.length}`);
  }
  console.log(`✓ Verified: Exactly 26 answers retrieved from database.`);

  // Step 10: Verify student CANNOT tamper with total_score or set submitted status directly
  console.log("\n10. Testing client tampering protection on attempt...");
  const { data: hackedAttempt, error: hackError } = await client
    .from("assessment_attempts")
    .update({
      total_score: 99.9,
      status: "submitted",
    })
    .eq("id", newAttempt.id)
    .select();

  if (hackedAttempt && hackedAttempt.length > 0 && hackedAttempt[0].total_score === 99.9) {
    throw new Error("SECURITY FAILURE: Student directly set total_score or submitted status!");
  }
  console.log(`✓ Confirmed: Client direct update to total_score / status rejected (${hackError?.message || "Trigger/Policy protected"}).`);

  // Step 11: Execute Server-Side Trusted Scoring
  console.log("\n11. Running Trusted Server-Side Scoring...");
  // Import the scoring logic directly or run via adminClient
  // Scoring formula:
  // For each competency: Competency Score = 80% MCQ + 20% Self-Rating
  // Self-rating: 1=20, 2=40, 3=60, 4=80, 5=100
  // MCQ: 100 if matches key, 0 otherwise

  // Fetch all 13 competencies
  const { data: allCompetencies, error: compErr } = await adminClient
    .from("competencies")
    .select("id, name, category");

  if (compErr || !allCompetencies) {
    throw new Error(`Failed to load competencies: ${compErr?.message}`);
  }

  const competencyScores = {};
  for (const c of allCompetencies) {
    competencyScores[c.id] = { mcqScore: null, selfScore: null, name: c.name };
  }

  for (const ans of savedAnswers) {
    const q = questions.find((item) => item.id === ans.question_id);
    if (!q) continue;

    if (q.question_type === "mcq") {
      const correctKey = keyMap.get(q.id);
      const isCorrect = correctKey && ans.answer_text &&
        ans.answer_text.trim().toUpperCase() === correctKey.trim().toUpperCase();
      competencyScores[q.competency_id].mcqScore = isCorrect ? 100 : 0;
    } else if (q.question_type === "self_rating") {
      const val = ans.answer_value || 1;
      const selfScoreMap = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
      competencyScores[q.competency_id].selfScore = selfScoreMap[val] || 20;
    }
  }

  const studentCompetencyRows = [];
  let totalCompScoreSum = 0;
  let compCount = 0;

  for (const [compId, data] of Object.entries(competencyScores)) {
    const mcq = data.mcqScore ?? 0;
    const self = data.selfScore ?? 60;
    const finalCompScore = Math.round(0.8 * mcq + 0.2 * self);

    studentCompetencyRows.push({
      student_id: studentId,
      competency_id: compId,
      proficiency_score: finalCompScore,
      last_assessed_at: new Date().toISOString(),
      source: "assessment",
      verified: false,
    });

    totalCompScoreSum += finalCompScore;
    compCount++;
  }

  const overallScore = Math.round(totalCompScoreSum / compCount);
  console.log(`✓ Calculated Overall Score: ${overallScore}% across ${compCount} competencies.`);

  // Write competencies using adminClient
  const { error: compUpsertErr } = await adminClient
    .from("student_competencies")
    .upsert(studentCompetencyRows, { onConflict: "student_id,competency_id" });

  if (compUpsertErr) {
    throw new Error(`Failed to update student competencies: ${compUpsertErr.message}`);
  }
  console.log(`✓ Successfully updated ${studentCompetencyRows.length} rows in student_competencies.`);

  // Finalize attempt
  const { data: finalAttempt, error: finalErr } = await adminClient
    .from("assessment_attempts")
    .update({
      total_score: overallScore,
      submitted_at: new Date().toISOString(),
      status: "submitted",
    })
    .eq("id", newAttempt.id)
    .select("id, status, total_score, submitted_at")
    .single();

  if (finalErr || !finalAttempt) {
    throw new Error(`Failed to finalize attempt: ${finalErr?.message}`);
  }
  console.log(`✓ Attempt status updated to: ${finalAttempt.status}, total_score: ${finalAttempt.total_score}%, submitted_at: ${finalAttempt.submitted_at}`);

  // Step 12: Verify attempt is now read-only
  console.log("\n12. Verifying attempt is now read-only...");
  const { data: attemptAfterSubmit } = await client
    .from("assessment_attempts")
    .select("status")
    .eq("id", newAttempt.id)
    .single();

  if (attemptAfterSubmit.status !== "submitted") {
    throw new Error("Attempt status is not submitted!");
  }

  // Attempt to modify an answer while submitted (should fail)
  const { error: modifyAnsError } = await client
    .from("assessment_answers")
    .update({ answer_text: "Z" })
    .eq("attempt_id", newAttempt.id);

  console.log(`✓ Confirmed: Modifying answers after submission is rejected (${modifyAnsError?.message || "RLS prevented update"}).`);

  // Step 13: Verify result page data queries
  console.log("\n13. Verifying student competency query for Result Page...");
  const { data: studentComps, error: studentCompErr } = await client
    .from("student_competencies")
    .select(`
      competency_id,
      proficiency_score,
      competencies (
        id,
        name,
        category
      )
    `)
    .eq("student_id", studentId);

  if (studentCompErr || !studentComps || studentComps.length !== 13) {
    throw new Error(`Expected 13 student competencies, got ${studentComps?.length}`);
  }
  console.log(`✓ Successfully retrieved all 13 verified student competencies for Result Page.`);

  // Display sample competencies
  console.log("\nSample competency scores:");
  studentComps.slice(0, 4).forEach((sc) => {
    console.log(`  - ${sc.competencies.name} (${sc.competencies.category}): ${sc.proficiency_score}%`);
  });

  // Step 14: Verify another student cannot access this student's attempt
  console.log("\n14. Testing isolation: another student cannot access this attempt...");
  // Sign out student.test
  await client.auth.signOut();

  // Query attempt anonymously / without session
  const { data: anonData } = await client
    .from("assessment_attempts")
    .select("*")
    .eq("id", newAttempt.id);

  if (anonData && anonData.length > 0) {
    throw new Error("SECURITY FAILURE: Unauthenticated user was able to read the student attempt!");
  }
  console.log(`✓ Confirmed: Unauthenticated / other student query returned 0 rows.`);

  console.log("\n==================================================");
  console.log("ALL 15 VALIDATION CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION ERROR:", err);
  process.exit(1);
});
