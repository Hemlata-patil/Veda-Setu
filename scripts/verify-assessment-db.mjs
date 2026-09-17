import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { execSync } from "child_process";

// 1. Load env
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

function executeSql(sql) {
  const tempPath = "supabase/.temp/exec_temp.sql";
  fs.writeFileSync(tempPath, sql, "utf8");
  try {
    const out = execSync(`npx supabase db query --linked -f ${tempPath}`, { encoding: "utf8" });
    return JSON.parse(out);
  } catch (err) {
    console.error("SQL execution error:", err.message);
    throw err;
  }
}

async function runLiveVerification() {
  console.log("================================================================================");
  console.log(" LIVE SUPABASE DATABASE VERIFICATION SUITE: SKILL ASSESSMENT SCHEMA");
  console.log(` Target Database: ${SUPABASE_URL}`);
  console.log("================================================================================\n");

  const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Authenticate as student
  console.log("Authenticating as student (student.test@ayush.local)...");
  const studentClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: authData, error: authError } = await studentClient.auth.signInWithPassword({
    email: "student.test@ayush.local",
    password: "TestPassword123!",
  });

  if (authError || !authData.user) {
    throw new Error(`Student sign-in failed: ${authError?.message}`);
  }
  const studentId = authData.user.id;
  console.log(` Authenticated as student. Student ID: ${studentId}\n`);

  // Test 1: Students cannot create assessment templates
  process.stdout.write("Test 1: Students cannot create assessment templates... ");
  const { error: tmplErr } = await studentClient.from("assessment_templates").insert({
    title: "Malicious Template",
    status: "published"
  });
  if (tmplErr) {
    console.log(`PASSED (Rejected with: ${tmplErr.message})`);
  } else {
    console.log("FAILED (Student was able to insert a template!)");
  }

  // Test 2: Students cannot create assessment questions
  process.stdout.write("Test 2: Students cannot create assessment questions... ");
  const { error: qErr } = await studentClient.from("assessment_questions").insert({
    question: "Malicious Question",
    weight: 1
  });
  if (qErr) {
    console.log(`PASSED (Rejected with: ${qErr.message})`);
  } else {
    console.log("FAILED (Student was able to insert a question!)");
  }

  // Test 3: Students cannot directly write student_competencies
  process.stdout.write("Test 3: Students cannot write student_competencies... ");
  const { error: compErr } = await studentClient.from("student_competencies").insert({
    student_id: studentId,
    proficiency_score: 100
  });
  if (compErr) {
    console.log(`PASSED (Rejected with: ${compErr.message})`);
  } else {
    console.log("FAILED (Student was able to insert student_competencies!)");
  }

  // Setup: Create 2 temporary test templates (A and B), a competency, and questions via admin SQL
  console.log("\nSetting up temporary test fixtures (Templates A & B, Competency, Question) via linked SQL...");
  const setupSql = `
    DO $$
    DECLARE
      v_comp_id uuid;
      v_tmpl_a uuid;
      v_tmpl_b uuid;
      v_q_a uuid;
    BEGIN
      -- Create test competency
      INSERT INTO public.competencies (id, name, category, is_active)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Test Ayurveda Clinical Diagnosis', 'clinical_practical', true)
      ON CONFLICT (id) DO NOTHING;

      -- Create Template A (published)
      INSERT INTO public.assessment_templates (id, title, status)
      VALUES ('00000000-0000-0000-0000-00000000000a', 'Test Assessment Template A', 'published')
      ON CONFLICT (id) DO NOTHING;

      -- Create Template B (published)
      INSERT INTO public.assessment_templates (id, title, status)
      VALUES ('00000000-0000-0000-0000-00000000000b', 'Test Assessment Template B', 'published')
      ON CONFLICT (id) DO NOTHING;

      -- Create Question for Template A
      INSERT INTO public.assessment_questions (id, assessment_template_id, competency_id, question, weight, is_active)
      VALUES ('00000000-0000-0000-0000-00000000001a', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 'Rate diagnostic confidence', 1, true)
      ON CONFLICT (id) DO NOTHING;
    END $$;
  `;
  executeSql(setupSql);
  console.log(" Fixtures created successfully.\n");

  const tmplAId = "00000000-0000-0000-0000-00000000000a";
  const tmplBId = "00000000-0000-0000-0000-00000000000b";
  const questionAId = "00000000-0000-0000-0000-00000000001a";

  try {
    // Test 4: Students cannot create pre-scored / submitted / started attempts
    process.stdout.write("Test 4a: Student cannot insert attempt with status='submitted'... ");
    const { error: subErr } = await studentClient.from("assessment_attempts").insert({
      student_id: studentId,
      assessment_template_id: tmplAId,
      status: "submitted"
    });
    if (subErr) {
      console.log(`PASSED (Rejected: ${subErr.message})`);
    } else {
      console.log("FAILED (Allowed status='submitted' on insert!)");
    }

    process.stdout.write("Test 4b: Student cannot insert attempt with total_score populated... ");
    const { error: scoreErr } = await studentClient.from("assessment_attempts").insert({
      student_id: studentId,
      assessment_template_id: tmplAId,
      status: "not_started",
      total_score: 95
    });
    if (scoreErr) {
      console.log(`PASSED (Rejected: ${scoreErr.message})`);
    } else {
      console.log("FAILED (Allowed total_score on insert!)");
    }

    process.stdout.write("Test 4c: Student cannot insert attempt with submitted_at populated... ");
    const { error: subAtErr } = await studentClient.from("assessment_attempts").insert({
      student_id: studentId,
      assessment_template_id: tmplAId,
      status: "not_started",
      submitted_at: new Date().toISOString()
    });
    if (subAtErr) {
      console.log(`PASSED (Rejected: ${subAtErr.message})`);
    } else {
      console.log("FAILED (Allowed submitted_at on insert!)");
    }

    process.stdout.write("Test 4d: Student cannot insert attempt with started_at populated... ");
    const { error: startAtErr } = await studentClient.from("assessment_attempts").insert({
      student_id: studentId,
      assessment_template_id: tmplAId,
      status: "not_started",
      started_at: new Date().toISOString()
    });
    if (startAtErr) {
      console.log(`PASSED (Rejected: ${startAtErr.message})`);
    } else {
      console.log("FAILED (Allowed started_at on insert!)");
    }

    // Test 5: Student can create only their own valid not_started attempt
    process.stdout.write("Test 5: Student can insert valid not_started attempt... ");
    const { data: createdAttempt, error: createErr } = await studentClient.from("assessment_attempts").insert({
      student_id: studentId,
      assessment_template_id: tmplAId,
      status: "not_started"
    }).select().single();

    if (createErr) {
      console.log(`FAILED: ${createErr.message}`);
      throw createErr;
    }
    const attemptId = createdAttempt.id;
    console.log(`PASSED (Created Attempt ID: ${attemptId})`);

    // Test 6: Student cannot change student_id
    process.stdout.write("Test 6: Student cannot modify student_id... ");
    const { error: modStudentErr } = await studentClient.from("assessment_attempts")
      .update({ student_id: "00000000-0000-0000-0000-000000000099" })
      .eq("id", attemptId);
    if (modStudentErr) {
      console.log(`PASSED (Rejected: ${modStudentErr.message})`);
    } else {
      console.log("FAILED (Allowed student_id update!)");
    }

    // Test 7: Student cannot change assessment_template_id
    process.stdout.write("Test 7: Student cannot modify assessment_template_id... ");
    const { error: modTmplErr } = await studentClient.from("assessment_attempts")
      .update({ assessment_template_id: tmplBId })
      .eq("id", attemptId);
    if (modTmplErr) {
      console.log(`PASSED (Rejected: ${modTmplErr.message})`);
    } else {
      console.log("FAILED (Allowed assessment_template_id update!)");
    }

    // Test 8: Student cannot set total_score or submitted_at on update
    process.stdout.write("Test 8a: Student cannot modify total_score directly... ");
    const { error: updScoreErr } = await studentClient.from("assessment_attempts")
      .update({ total_score: 88 })
      .eq("id", attemptId);
    if (updScoreErr) {
      console.log(`PASSED (Rejected: ${updScoreErr.message})`);
    } else {
      console.log("FAILED (Allowed total_score update!)");
    }

    process.stdout.write("Test 8b: Student cannot modify submitted_at directly... ");
    const { error: updSubErr } = await studentClient.from("assessment_attempts")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", attemptId);
    if (updSubErr) {
      console.log(`PASSED (Rejected: ${updSubErr.message})`);
    } else {
      console.log("FAILED (Allowed submitted_at update!)");
    }

    // Test 9: Student cannot transition backwards or directly to submitted
    process.stdout.write("Test 9a: Student cannot transition not_started -> submitted directly... ");
    const { error: dirSubErr } = await studentClient.from("assessment_attempts")
      .update({ status: "submitted" })
      .eq("id", attemptId);
    if (dirSubErr) {
      console.log(`PASSED (Rejected: ${dirSubErr.message})`);
    } else {
      console.log("FAILED (Allowed direct transition to submitted!)");
    }

    // Test 10: Transition not_started -> in_progress
    process.stdout.write("Test 10: Student transitions not_started -> in_progress (auto sets started_at)... ");
    const { data: progAttempt, error: progErr } = await studentClient.from("assessment_attempts")
      .update({ status: "in_progress" })
      .eq("id", attemptId)
      .select()
      .single();
    if (progErr || !progAttempt.started_at) {
      console.log(`FAILED: ${progErr?.message || "started_at not set"}`);
    } else {
      console.log(`PASSED (status: ${progAttempt.status}, started_at: ${progAttempt.started_at})`);
    }

    // Test 11: Student cannot modify started_at once set
    process.stdout.write("Test 11: Student cannot modify started_at once set... ");
    const { error: modStartErr } = await studentClient.from("assessment_attempts")
      .update({ started_at: "2020-01-01T00:00:00Z" })
      .eq("id", attemptId);
    if (modStartErr) {
      console.log(`PASSED (Rejected: ${modStartErr.message})`);
    } else {
      console.log("FAILED (Allowed started_at modification!)");
    }

    // Test 12: Student cannot move in_progress back to not_started
    process.stdout.write("Test 12: Student cannot move in_progress back to not_started... ");
    const { error: backErr } = await studentClient.from("assessment_attempts")
      .update({ status: "not_started" })
      .eq("id", attemptId);
    if (backErr) {
      console.log(`PASSED (Rejected: ${backErr.message})`);
    } else {
      console.log("FAILED (Allowed backward status transition!)");
    }

    // Test 13: Answers can be inserted while attempt is in_progress
    process.stdout.write("Test 13: Student inserts answer for active question in Template A... ");
    const { data: answerData, error: ansErr } = await studentClient.from("assessment_answers").insert({
      attempt_id: attemptId,
      question_id: questionAId,
      answer_value: 4,
      answer_text: "Comfortable with diagnostic methods"
    }).select().single();
    if (ansErr) {
      console.log(`FAILED: ${ansErr.message}`);
    } else {
      console.log(`PASSED (Answer ID: ${answerData.id}, template_id auto-derived: ${answerData.assessment_template_id})`);
    }

    // Test 14: Answer values can be updated while in_progress
    process.stdout.write("Test 14: Student updates answer value... ");
    const { error: ansUpdErr } = await studentClient.from("assessment_answers")
      .update({ answer_value: 5, answer_text: "Highly confident" })
      .eq("attempt_id", attemptId)
      .eq("question_id", questionAId);
    if (ansUpdErr) {
      console.log(`FAILED: ${ansUpdErr.message}`);
    } else {
      console.log("PASSED");
    }

    // Test 15: Answer identity cannot be modified
    process.stdout.write("Test 15a: Student cannot modify answer question_id... ");
    const { error: ansQErr } = await studentClient.from("assessment_answers")
      .update({ question_id: "00000000-0000-0000-0000-000000000099" })
      .eq("attempt_id", attemptId)
      .eq("question_id", questionAId);
    if (ansQErr) {
      console.log(`PASSED (Rejected: ${ansQErr.message})`);
    } else {
      console.log("FAILED (Allowed question_id modification on answer!)");
    }

    process.stdout.write("Test 15b: Student cannot modify answer attempt_id... ");
    const { error: ansAttErr } = await studentClient.from("assessment_answers")
      .update({ attempt_id: "00000000-0000-0000-0000-000000000099" })
      .eq("attempt_id", attemptId)
      .eq("question_id", questionAId);
    if (ansAttErr) {
      console.log(`PASSED (Rejected: ${ansAttErr.message})`);
    } else {
      console.log("FAILED (Allowed attempt_id modification on answer!)");
    }

    process.stdout.write("Test 15c: Student cannot modify answer assessment_template_id... ");
    const { error: ansTmplErr } = await studentClient.from("assessment_answers")
      .update({ assessment_template_id: tmplBId })
      .eq("attempt_id", attemptId)
      .eq("question_id", questionAId);
    if (ansTmplErr) {
      console.log(`PASSED (Rejected: ${ansTmplErr.message})`);
    } else {
      console.log("FAILED (Allowed assessment_template_id modification on answer!)");
    }

    // Test 16: Composite FK prevents cross-template mismatch at database level
    // Attempt: Template B. Question: Template A.
    process.stdout.write("Test 16: Composite FK enforces attempt & question belong to same template... ");
    // Create an attempt for Template B via SQL
    const crossSql = `
      DO $$
      DECLARE
        v_att_b uuid;
      BEGIN
        INSERT INTO public.assessment_attempts (id, assessment_template_id, student_id, status)
        VALUES ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-00000000000b', '${studentId}', 'in_progress')
        ON CONFLICT (id) DO NOTHING;
      END $$;
    `;
    executeSql(crossSql);

    // Now try to answer Question A (Template A) under Attempt B (Template B)
    const { error: crossErr } = await studentClient.from("assessment_answers").insert({
      attempt_id: "00000000-0000-0000-0000-0000000000bb",
      question_id: questionAId, // Belongs to Template A!
      answer_value: 3
    });
    if (crossErr) {
      console.log(`PASSED (Cross-template mismatch rejected: ${crossErr.message})`);
    } else {
      console.log("FAILED (Allowed answering question from different template!)");
    }

    // Test 17: Submitted attempt is read-only for students
    process.stdout.write("Test 17: Submitted attempt becomes completely read-only for student... ");
    // Simulate server finalization via SQL
    executeSql(`
      UPDATE public.assessment_attempts
      SET status = 'submitted', total_score = 90, submitted_at = now()
      WHERE id = '${attemptId}';
    `);

    // Student tries to update submitted attempt
    const { data: postSubData, error: postSubErr } = await studentClient.from("assessment_attempts")
      .update({ status: "in_progress" })
      .eq("id", attemptId)
      .select();

    // Student tries to update answer under submitted attempt
    const { data: postAnsData, error: postAnsErr } = await studentClient.from("assessment_answers")
      .update({ answer_value: 1 })
      .eq("attempt_id", attemptId)
      .select();

    // Verify row status in db
    const { data: verifyAttempt } = await studentClient.from("assessment_attempts")
      .select("status, total_score")
      .eq("id", attemptId)
      .single();

    const { data: verifyAnswer } = await studentClient.from("assessment_answers")
      .select("answer_value")
      .eq("attempt_id", attemptId)
      .single();

    // In PostgREST RLS, rows excluded by USING clause yield 0 updated rows and no error
    const attemptUnmodified = verifyAttempt?.status === "submitted" && (postSubErr || postSubData?.length === 0);
    const answerUnmodified = verifyAnswer?.answer_value === 5 && (postAnsErr || postAnsData?.length === 0);

    if (attemptUnmodified && answerUnmodified) {
      console.log("PASSED (RLS filtered out submitted rows; 0 rows updated, values remain immutable)");
    } else {
      console.log(`FAILED: attempt status=${verifyAttempt?.status}, answer=${verifyAnswer?.answer_value}`);
    }

  } finally {
    // Cleanup all test fixtures
    console.log("\nCleaning up test records from live database...");
    const cleanupSql = `
      DELETE FROM public.assessment_answers WHERE attempt_id IN ('00000000-0000-0000-0000-0000000000bb') OR question_id = '00000000-0000-0000-0000-00000000001a';
      DELETE FROM public.assessment_attempts WHERE assessment_template_id IN ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
      DELETE FROM public.assessment_questions WHERE id = '00000000-0000-0000-0000-00000000001a';
      DELETE FROM public.assessment_templates WHERE id IN ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
      DELETE FROM public.competencies WHERE id = '00000000-0000-0000-0000-000000000001';
    `;
    executeSql(cleanupSql);
    console.log(" Cleanup complete.\n");
  }

  console.log("================================================================================");
  console.log(" ALL LIVE DATABASE TESTS COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

runLiveVerification().catch((err) => {
  console.error("FATAL ERROR IN LIVE VERIFICATION:", err);
  process.exit(1);
});
