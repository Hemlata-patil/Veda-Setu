import jwt from "jsonwebtoken";
import { metadataService } from "../src/services/metadata.service";
import { assessmentService } from "../src/services/assessment.service";
import { studentCompetencyService } from "../src/services/student-competency.service";
import { requireAuth, requireRole } from "../src/middleware/auth.middleware";
import { env } from "../src/config/env";
import * as dbModule from "../src/db";

async function runModule2Tests() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 2: CORE METADATA & COMPETENCIES TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       ${detail}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // Hermetic In-Memory Database Simulator for Module 2
  // ---------------------------------------------------------------------------
  const institutionsTable = [
    {
      id: "inst-1",
      name: "All India Institute of Ayurveda (AIIA)",
      code: "AIIA-DEL",
      category: "National Institute",
      location: "New Delhi, Delhi",
      verification_status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "inst-2",
      name: "National Institute of Ayurveda (NIA)",
      code: "NIA-JAI",
      category: "National Institute",
      location: "Jaipur, Rajasthan",
      verification_status: "approved",
      created_at: new Date().toISOString(),
    },
  ];

  const organizationsTable = [
    {
      id: "org-1",
      name: "Dabur India Ltd (Ayurveda Healthcare Division)",
      organization_type: "Ayurvedic Pharmaceutical Manufacturer",
      location: "Ghaziabad, Uttar Pradesh",
      verification_status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "org-2",
      name: "Himalaya Wellness Company",
      organization_type: "Ayurvedic Wellness & Phytopharmaceuticals",
      location: "Bengaluru, Karnataka",
      verification_status: "approved",
      created_at: new Date().toISOString(),
    },
  ];

  const skillsTable = [
    {
      id: "skill-1",
      name: "Nadi Pariksha (Ayurvedic Pulse Examination)",
      category: "Clinical Diagnosis",
      description: "Skill in examining radial pulse characteristics according to Tridosha states.",
      source: "NCISM Curriculum",
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "skill-2",
      name: "Prakriti Assessment",
      category: "Ayurvedic Foundations",
      description: "Systematic assessment of anatomical, physiological, and psychological Doshic constitution.",
      source: "NCISM Curriculum",
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  // The 13 canonical Ayurveda competencies
  const CANONICAL_COMPETENCIES = [
    { name: "Ayurvedic Foundational Understanding", category: "academic_domain" },
    { name: "Application of Ayurvedic Concepts", category: "academic_domain" },
    { name: "Contemporary Medical Understanding", category: "academic_domain" },
    { name: "Clinical History and Examination", category: "clinical_practical" },
    { name: "Clinical Interpretation", category: "clinical_practical" },
    { name: "Patient Communication", category: "clinical_practical" },
    { name: "Clinical Documentation and Record Keeping", category: "clinical_practical" },
    { name: "Research Methodology", category: "research" },
    { name: "Statistical Understanding", category: "research" },
    { name: "Evidence-Based Practice", category: "research" },
    { name: "Scientific Communication", category: "research" },
    { name: "Professional Ethics and Conduct", category: "professional" },
    { name: "Teamwork and Professional Communication", category: "professional" },
  ];

  const competenciesTable = CANONICAL_COMPETENCIES.map((c, idx) => ({
    id: `comp-${idx + 1}`,
    name: c.name,
    category: c.category,
    description: `Description for ${c.name}`,
    source: "NCISM Curriculum",
    source_reference: "Official curriculum reference",
    is_active: true,
    created_at: new Date().toISOString(),
  }));

  const templateId = "template-ayush-assessment-1";
  const assessmentTemplatesTable = [
    {
      id: templateId,
      title: "Ayush Skill & Competency Assessment",
      description: "An initial competency assessment designed to understand a learner's skill profile.",
      program: "BAMS / Ayurveda",
      year: null,
      status: "published",
      published_at: new Date().toISOString(),
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 26 questions: 13 MCQs and 13 Self-Rating
  const questionsTable: Array<{
    id: string;
    assessment_template_id: string;
    competency_id: string;
    question: string;
    question_type: "mcq" | "self_rating";
    weight: number;
    max_score: number;
    options: any;
    difficulty: string | null;
    source: string | null;
    source_reference: string | null;
    is_active: boolean;
    created_at: string;
  }> = [];

  // 13 protected answer keys
  const questionKeysTable = new Map<string, any>();

  const mcqKeyValues = ["A", "B", "C", "B", "D", "A", "C", "B", "D", "A", "C", "B", "D"];

  for (let i = 0; i < 13; i++) {
    const comp = competenciesTable[i];

    // MCQ question (odd index: q1, q3...)
    const mcqId = `q-mcq-${i + 1}`;
    questionsTable.push({
      id: mcqId,
      assessment_template_id: templateId,
      competency_id: comp.id,
      question: `MCQ question for ${comp.name}`,
      question_type: "mcq",
      weight: 1.0,
      max_score: 1.0,
      options: [
        { value: "A", label: "Option A" },
        { value: "B", label: "Option B" },
        { value: "C", label: "Option C" },
        { value: "D", label: "Option D" },
      ],
      difficulty: "medium",
      source: "NCISM BAMS Curriculum",
      source_reference: "Curriculum Reference",
      is_active: true,
      created_at: new Date().toISOString(),
    });

    questionKeysTable.set(mcqId, { value: mcqKeyValues[i] });

    // Self-rating question (even index: q2, q4...)
    const selfRatingId = `q-sr-${i + 1}`;
    questionsTable.push({
      id: selfRatingId,
      assessment_template_id: templateId,
      competency_id: comp.id,
      question: `Self-rating confidence question for ${comp.name}`,
      question_type: "self_rating",
      weight: 0.25,
      max_score: 1.0,
      options: [
        { value: 1, label: "Very Low" },
        { value: 2, label: "Low" },
        { value: 3, label: "Moderate" },
        { value: 4, label: "High" },
        { value: 5, label: "Very High" },
      ],
      difficulty: "easy",
      source: "NCISM Curriculum",
      source_reference: "Curriculum Reference",
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }

  // Attempts, answers, and student competencies
  const attemptsTable = new Map<string, any>();
  const answersTable = new Map<string, any>(); // key: `${attempt_id}:${question_id}`
  const studentCompetenciesTable = new Map<string, any>(); // key: `${student_id}:${competency_id}`

  // Mock DB query implementation
  const mockQueryFn = async (sql: string, params?: any[]) => {
    const text = sql.trim();

    // 1. Institutions
    if (text.includes("FROM public.institutions")) {
      const status = params?.[0] || "approved";
      return { rows: institutionsTable.filter((i) => i.verification_status === status) };
    }

    // 2. Organizations
    if (text.includes("FROM public.organizations")) {
      const status = params?.[0] || "approved";
      return { rows: organizationsTable.filter((o) => o.verification_status === status) };
    }

    // 3. Skills
    if (text.includes("FROM public.skills")) {
      if (params?.[0]) {
        return { rows: skillsTable.filter((s) => s.is_active && s.category === params[0]) };
      }
      return { rows: skillsTable.filter((s) => s.is_active) };
    }

    // 4. Competencies
    if (text.includes("FROM public.competencies") && !text.includes("JOIN")) {
      if (params?.[0]) {
        return { rows: competenciesTable.filter((c) => c.is_active && c.category === params[0]) };
      }
      return { rows: competenciesTable.filter((c) => c.is_active) };
    }

    // 5. Assessment Templates list
    if (text.includes("FROM public.assessment_templates t") && !text.includes("WHERE t.id = $1")) {
      return {
        rows: assessmentTemplatesTable
          .filter((t) => t.status === "published")
          .map((t) => ({ ...t, question_count: questionsTable.length })),
      };
    }

    // 6. Single template by ID
    if (text.includes("FROM public.assessment_templates t") && text.includes("WHERE t.id = $1")) {
      const id = params?.[0];
      const match = assessmentTemplatesTable.find((t) => t.id === id && t.status === "published");
      return { rows: match ? [{ ...match, question_count: questionsTable.length }] : [] };
    }

    // 7. Assessment questions (Safe student query)
    if (text.includes("FROM public.assessment_questions") && !text.includes("JOIN") && text.includes("is_active = true")) {
      const tId = params?.[0];
      const qs = questionsTable.filter((q) => q.assessment_template_id === tId && q.is_active);
      return { rows: qs };
    }

    // 8. Check existing attempt: SELECT id, status FROM public.assessment_attempts WHERE student_id = $1 AND assessment_template_id = $2
    if (text.includes("FROM public.assessment_attempts") && text.includes("WHERE student_id = $1 AND assessment_template_id = $2")) {
      const studentId = params?.[0];
      const tId = params?.[1];
      const match = Array.from(attemptsTable.values()).find(
        (a) => a.student_id === studentId && a.assessment_template_id === tId
      );
      return { rows: match ? [{ id: match.id, status: match.status }] : [] };
    }

    // 9. Update attempt status from not_started to in_progress
    if (text.includes("UPDATE public.assessment_attempts") && text.includes("status = 'in_progress'")) {
      const attemptId = params?.[0];
      const match = attemptsTable.get(attemptId);
      if (match) {
        match.status = "in_progress";
        match.started_at = new Date().toISOString();
      }
      return { rows: match ? [match] : [] };
    }

    // 10. Insert new attempt
    if (text.includes("INSERT INTO public.assessment_attempts")) {
      const tId = params?.[0];
      const studentId = params?.[1];
      const id = `attempt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newAttempt = {
        id,
        assessment_template_id: tId,
        student_id: studentId,
        status: "in_progress",
        started_at: new Date().toISOString(),
        submitted_at: null,
        total_score: null,
      };
      attemptsTable.set(id, newAttempt);
      return { rows: [{ id, status: "in_progress" }] };
    }

    // 11. Get attempt with template title: SELECT a.*, t.title FROM public.assessment_attempts a JOIN ...
    if (text.includes("FROM public.assessment_attempts a") && text.includes("JOIN public.assessment_templates t")) {
      const attemptId = params?.[0];
      const match = attemptsTable.get(attemptId);
      if (!match) return { rows: [] };
      const tmpl = assessmentTemplatesTable.find((t) => t.id === match.assessment_template_id);
      return {
        rows: [
          {
            ...match,
            template_title: tmpl?.title || "Ayush Assessment",
          },
        ],
      };
    }

    // 12. Get answers for attempt: SELECT question_id, answer_value, answer_text FROM public.assessment_answers
    if (text.includes("FROM public.assessment_answers") && text.includes("WHERE attempt_id = $1")) {
      const attemptId = params?.[0];
      const ans = Array.from(answersTable.values()).filter((a) => a.attempt_id === attemptId);
      return { rows: ans };
    }

    // 13. Verify attempt existence: SELECT id, student_id, assessment_template_id, status FROM public.assessment_attempts WHERE id = $1
    if (text.includes("FROM public.assessment_attempts") && text.includes("WHERE id = $1")) {
      const attemptId = params?.[0];
      const match = attemptsTable.get(attemptId);
      return { rows: match ? [match] : [] };
    }

    // 14. Get student competencies: SELECT sc.*, c.name, c.category ... FROM public.student_competencies sc
    if (text.includes("FROM public.student_competencies sc")) {
      const studentId = params?.[0];
      const scList = Array.from(studentCompetenciesTable.values())
        .filter((sc) => sc.student_id === studentId)
        .map((sc) => {
          const comp = competenciesTable.find((c) => c.id === sc.competency_id);
          return {
            ...sc,
            competency_name: comp?.name || "",
            competency_category: comp?.category || "",
            competency_description: comp?.description || "",
          };
        });
      return { rows: scList };
    }

    return { rows: [] };
  };

  // Mock DB transaction pool client
  let shouldSimulateRollback = false;

  const mockConnectFn = async () => {
    // Snapshot state for transaction rollback simulation
    const snapshotAttempts = new Map(
      Array.from(attemptsTable.entries()).map(([k, v]) => [k, { ...v }])
    );
    const snapshotAnswers = new Map(
      Array.from(answersTable.entries()).map(([k, v]) => [k, { ...v }])
    );
    const snapshotCompetencies = new Map(
      Array.from(studentCompetenciesTable.entries()).map(([k, v]) => [k, { ...v }])
    );

    return {
      query: async (sql: string, params?: any[]) => {
        const text = sql.trim();

        if (text === "BEGIN") {
          return { rows: [] };
        }

        if (text === "COMMIT") {
          if (shouldSimulateRollback) {
            throw new Error("Simulated transactional commit failure");
          }
          return { rows: [] };
        }

        if (text === "ROLLBACK") {
          // Restore table states to snapshot on rollback
          attemptsTable.clear();
          for (const [k, v] of snapshotAttempts.entries()) attemptsTable.set(k, v);
          answersTable.clear();
          for (const [k, v] of snapshotAnswers.entries()) answersTable.set(k, v);
          studentCompetenciesTable.clear();
          for (const [k, v] of snapshotCompetencies.entries()) studentCompetenciesTable.set(k, v);
          return { rows: [] };
        }

        // Lock attempt: SELECT ... FROM public.assessment_attempts WHERE id = $1 FOR UPDATE
        if (text.includes("FROM public.assessment_attempts") && text.includes("FOR UPDATE")) {
          const attemptId = params?.[0];
          const match = attemptsTable.get(attemptId);
          return { rows: match ? [match] : [] };
        }

        // Questions joined with competencies: SELECT q.*, c.name ... FROM public.assessment_questions q JOIN public.competencies c
        if (text.includes("FROM public.assessment_questions q") && text.includes("JOIN public.competencies c")) {
          const tId = params?.[0];
          const qs = questionsTable
            .filter((q) => q.assessment_template_id === tId && q.is_active)
            .map((q) => {
              const comp = competenciesTable.find((c) => c.id === q.competency_id);
              return {
                ...q,
                competency_name: comp?.name || "",
                competency_category: comp?.category || "",
              };
            });
          return { rows: qs };
        }

        // Answers for attempt
        if (text.includes("FROM public.assessment_answers") && text.includes("WHERE attempt_id = $1")) {
          const attemptId = params?.[0];
          const ans = Array.from(answersTable.values()).filter((a) => a.attempt_id === attemptId);
          return { rows: ans };
        }

        // Protected keys: SELECT question_id, correct_answer FROM public.assessment_question_keys WHERE question_id = ANY($1::uuid[])
        if (text.includes("FROM public.assessment_question_keys")) {
          const qIds: string[] = params?.[0] || [];
          const keys = qIds
            .map((id) => ({
              question_id: id,
              correct_answer: questionKeysTable.get(id),
            }))
            .filter((k) => k.correct_answer !== undefined);
          return { rows: keys };
        }

        // Upsert answer: INSERT INTO public.assessment_answers ... ON CONFLICT
        if (text.includes("INSERT INTO public.assessment_answers")) {
          const attempt_id = params?.[0];
          const question_id = params?.[1];
          const assessment_template_id = params?.[2];
          const answer_value = params?.[3];
          const answer_text = params?.[4];
          const key = `${attempt_id}:${question_id}`;
          answersTable.set(key, {
            attempt_id,
            question_id,
            assessment_template_id,
            answer_value,
            answer_text,
          });
          return { rows: [] };
        }

        // Upsert student_competencies: INSERT INTO public.student_competencies ... ON CONFLICT
        if (text.includes("INSERT INTO public.student_competencies")) {
          const student_id = params?.[0];
          const competency_id = params?.[1];
          const proficiency_score = params?.[2];
          const key = `${student_id}:${competency_id}`;
          studentCompetenciesTable.set(key, {
            id: `sc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            student_id,
            competency_id,
            proficiency_score,
            last_assessed_at: new Date().toISOString(),
            source: "Platform Assessment: Ayush Skill & Competency Assessment",
            verified: false,
          });
          return { rows: [] };
        }

        // Update attempt: UPDATE public.assessment_attempts SET status = 'submitted' ...
        if (text.includes("UPDATE public.assessment_attempts") && text.includes("status = 'submitted'")) {
          const total_score = params?.[0];
          const attemptId = params?.[1];
          const match = attemptsTable.get(attemptId);
          if (match) {
            match.status = "submitted";
            match.total_score = total_score;
            match.submitted_at = new Date().toISOString();
          }
          return { rows: [] };
        }

        return { rows: [] };
      },
      release: () => {},
    };
  };

  (dbModule as any).query = mockQueryFn;
  (dbModule.db as any).query = mockQueryFn;
  (dbModule.pool as any).connect = mockConnectFn;
  (dbModule.db.pool as any).connect = mockConnectFn;

  // ---------------------------------------------------------------------------
  // TESTS A-D: Core Metadata Retrieval
  // ---------------------------------------------------------------------------
  console.log("--- 1. Core Metadata Retrieval Tests ---");

  // A. Institutions metadata
  try {
    const insts = await metadataService.getInstitutions();
    assert(
      insts.length === 2 && insts[0].verification_status === "approved",
      "Test A: Institutions metadata retrieval succeeds",
      `Found ${insts.length} approved institutions`
    );
  } catch (err: any) {
    assert(false, "Test A: Institutions metadata retrieval succeeds", err.message);
  }

  // B. Organizations metadata
  try {
    const orgs = await metadataService.getOrganizations();
    assert(
      orgs.length === 2 && orgs[0].verification_status === "approved",
      "Test B: Organizations metadata retrieval succeeds",
      `Found ${orgs.length} approved organizations`
    );
  } catch (err: any) {
    assert(false, "Test B: Organizations metadata retrieval succeeds", err.message);
  }

  // C. Skills metadata
  try {
    const skills = await metadataService.getSkills();
    assert(
      skills.length === 2 && skills.every((s) => s.is_active),
      "Test C: Skills metadata retrieval succeeds",
      `Found ${skills.length} active skills`
    );
  } catch (err: any) {
    assert(false, "Test C: Skills metadata retrieval succeeds", err.message);
  }

  // D & E. Competencies metadata and exactly 13 canonical competencies
  try {
    const comps = await metadataService.getCompetencies();
    const exact13 = comps.length === 13;
    const namesMatch = CANONICAL_COMPETENCIES.every((canonical) =>
      comps.some((c) => c.name === canonical.name && c.category === canonical.category)
    );

    assert(
      comps.length > 0 && namesMatch,
      "Test D: Competencies metadata retrieval succeeds",
      `Retrieved ${comps.length} competencies across all 4 categories`
    );

    assert(
      exact13 && namesMatch,
      "Test E: Exactly 13 canonical Ayurveda competencies exist without modification",
      "All 13 canonical competencies verified against NCISM/BAMS standard"
    );
  } catch (err: any) {
    assert(false, "Test D/E: Competencies retrieval", err.message);
  }

  // ---------------------------------------------------------------------------
  // TESTS F-H: Assessment Templates & Questions (Security Isolation)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Assessment Template & Question Isolation Tests ---");

  // F. Published assessment retrieval
  let publishedTemplate: any = null;
  try {
    const templates = await assessmentService.getPublishedTemplates();
    publishedTemplate = templates[0];
    assert(
      templates.length === 1 && templates[0].status === "published",
      "Test F: Published assessment template retrieval succeeds",
      `Template: "${templates[0].title}"`
    );
  } catch (err: any) {
    assert(false, "Test F: Published assessment template retrieval succeeds", err.message);
  }

  // G. Exactly 26 assessment questions exist
  let questions: any[] = [];
  try {
    questions = await assessmentService.getAssessmentQuestions(publishedTemplate.id);
    const mcqCount = questions.filter((q) => q.question_type === "mcq").length;
    const srCount = questions.filter((q) => q.question_type === "self_rating").length;

    assert(
      questions.length === 26 && mcqCount === 13 && srCount === 13,
      "Test G: Exactly 26 assessment questions exist (13 MCQs + 13 Self-Rating)",
      `Found ${questions.length} questions: ${mcqCount} MCQ, ${srCount} Self-Rating`
    );
  } catch (err: any) {
    assert(false, "Test G: Exactly 26 assessment questions exist", err.message);
  }

  // H. Answer keys are strictly not exposed in student-safe question list
  const hasKeyField = questions.some(
    (q: any) =>
      "correct_answer" in q ||
      "correct_key" in q ||
      "answer_key" in q ||
      "correctAnswer" in q
  );

  assert(
    !hasKeyField,
    "Test H: Answer keys are NOT exposed in student question endpoints",
    "Strict separation between public questions and internal assessment_question_keys verified"
  );

  // ---------------------------------------------------------------------------
  // TESTS I-M: Assessment Attempts & Ownership Isolation
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Attempt Ownership & Progression Tests ---");

  const student1Id = "student-user-uuid-111";
  const student2Id = "student-user-uuid-222";

  // I. Student can start/create own attempt
  let student1Attempt: any = null;
  try {
    student1Attempt = await assessmentService.startAttempt(student1Id, publishedTemplate.id);
    assert(
      Boolean(student1Attempt?.attemptId && student1Attempt?.status === "in_progress"),
      "Test I: Student can start own assessment attempt",
      `Attempt ID: ${student1Attempt.attemptId}, Status: ${student1Attempt.status}`
    );
  } catch (err: any) {
    assert(false, "Test I: Student can start own assessment attempt", err.message);
  }

  // J. Student can retrieve own attempt
  try {
    const attemptDetail = await assessmentService.getAttempt(student1Attempt.attemptId, student1Id);
    assert(
      attemptDetail.id === student1Attempt.attemptId && attemptDetail.student_id === student1Id,
      "Test J: Student can retrieve own assessment attempt",
      `Retrieved attempt for student: ${attemptDetail.student_id}`
    );
  } catch (err: any) {
    assert(false, "Test J: Student can retrieve own assessment attempt", err.message);
  }

  // K. Student cannot retrieve another student's attempt
  try {
    await assessmentService.getAttempt(student1Attempt.attemptId, student2Id);
    assert(false, "Test K: Student cannot retrieve another student's attempt", "Expected 403 Forbidden");
  } catch (err: any) {
    assert(
      err.statusCode === 403 || err.message.toLowerCase().includes("access denied"),
      "Test K: Student cannot retrieve another student's attempt",
      `Correctly blocked cross-student access: "${err.message}"`
    );
  }

  // L. Student can submit valid answers for in-progress attempt
  try {
    const mcqQuestions = questions.filter((q) => q.question_type === "mcq");
    const srQuestions = questions.filter((q) => q.question_type === "self_rating");

    // Submit answers for 13 MCQs (all correct to test score calculation)
    // and 13 self-ratings (all 5: Very High = 100)
    const answersToSubmit = [
      ...mcqQuestions.map((q, idx) => ({
        questionId: q.id,
        answerText: mcqKeyValues[idx],
        answerValue: null,
      })),
      ...srQuestions.map((q) => ({
        questionId: q.id,
        answerValue: 5, // 5 = 100 on selfRating scale
        answerText: null,
      })),
    ];

    const saveRes = await assessmentService.saveAnswers(student1Attempt.attemptId, student1Id, answersToSubmit);
    assert(
      saveRes.savedCount === 26,
      "Test L: Student can submit valid answers for in-progress attempt",
      `Successfully saved ${saveRes.savedCount} answers`
    );
  } catch (err: any) {
    assert(false, "Test L: Student can submit valid answers", err.message);
  }

  // ---------------------------------------------------------------------------
  // TESTS N-P: Transactional Completion, Scoring & Competencies
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Scoring Logic, Competencies & Transactions ---");

  // N. Assessment completion calculates correct score (80% MCQ + 20% Self-Rating)
  // With 100% MCQ and rating 5 (100% self-rating), score must be round(0.8*100 + 0.2*100) = 100.
  let completionResult: any = null;
  try {
    completionResult = await assessmentService.completeAttempt(student1Attempt.attemptId, student1Id);
    assert(
      completionResult.totalScore === 100 && completionResult.competencyScores.length === 13,
      "Test N: Assessment completion calculates correct score (80% MCQ + 20% Self-Rating)",
      `Total score: ${completionResult.totalScore}/100 across 13 competencies`
    );
  } catch (err: any) {
    assert(false, "Test N: Assessment completion calculates correct score", err.message);
  }

  // M. Student cannot modify a completed/submitted attempt
  try {
    await assessmentService.saveAnswers(student1Attempt.attemptId, student1Id, [
      { questionId: questions[0].id, answerText: "Z" },
    ]);
    assert(false, "Test M: Student cannot modify completed attempt", "Expected error modifying submitted attempt");
  } catch (err: any) {
    assert(
      err.statusCode === 400 || err.message.toLowerCase().includes("submitted"),
      "Test M: Student cannot modify completed attempt",
      `Correctly rejected answer modification on submitted attempt: "${err.message}"`
    );
  }

  // O. Competency scores are updated in student_competencies
  try {
    const studentCompetencies = await studentCompetencyService.getStudentCompetencies(student1Id);
    const has13 = studentCompetencies.length === 13;
    const allScored100 = studentCompetencies.every((sc) => sc.proficiency_score === 100);

    assert(
      has13 && allScored100,
      "Test O: Competency scores are generated and stored in student_competencies correctly",
      `Stored ${studentCompetencies.length} student competency records with verified 100% score`
    );
  } catch (err: any) {
    assert(false, "Test O: Competency scores in student_competencies", err.message);
  }

  // P. Student can retrieve own competency results
  try {
    const myComps = await studentCompetencyService.getStudentCompetencies(student1Id);
    assert(
      myComps.length === 13 && myComps[0].student_id === student1Id,
      "Test P: Student can retrieve own competency results",
      `Student ${student1Id} successfully loaded ${myComps.length} competency records`
    );
  } catch (err: any) {
    assert(false, "Test P: Student can retrieve own competency results", err.message);
  }

  // ---------------------------------------------------------------------------
  // TESTS Q-S: Authorization & Transactional Rollback
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Security, Authorization & Rollback Tests ---");

  // Q. Unauthorized access to protected endpoints returns 401
  let unauthRejected = false;
  const mockReqQ: any = { cookies: {}, headers: {} };
  const mockResQ: any = {
    status: (code: number) => ({
      json: () => {
        if (code === 401) unauthRejected = true;
      },
    }),
  };
  requireAuth(mockReqQ, mockResQ, () => {});
  assert(unauthRejected, "Test Q: Unauthenticated access returns 401 Unauthorized");

  // R. Unauthorized role access returns 403 where applicable
  let roleForbidden = false;
  const studentOnlyMiddleware = requireRole("student");
  const industryReq: any = { user: { userId: "ind-1", role: "industry" } };
  const mockResR: any = {
    status: (code: number) => ({
      json: () => {
        if (code === 403) roleForbidden = true;
      },
    }),
  };
  studentOnlyMiddleware(industryReq, mockResR, () => {});
  assert(roleForbidden, "Test R: Unauthorized role access returns 403 Forbidden");

  // S. Failed completion transaction rolls back cleanly
  // Start an attempt for student 2, set simulated failure, assert rollback
  const student2Attempt = await assessmentService.startAttempt(student2Id, publishedTemplate.id);
  shouldSimulateRollback = true;
  try {
    await assessmentService.completeAttempt(student2Attempt.attemptId, student2Id);
    assert(false, "Test S: Failed completion transaction rolls back correctly", "Expected transaction failure");
  } catch (err: any) {
    // Check that attempt remains 'in_progress', not corrupted
    const attemptAfterFail = attemptsTable.get(student2Attempt.attemptId);
    assert(
      attemptAfterFail.status === "in_progress" && attemptAfterFail.total_score === null,
      "Test S: Failed completion transaction rolls back correctly without partial state corruption",
      `Attempt status remained clean: '${attemptAfterFail.status}', total_score: ${attemptAfterFail.total_score}`
    );
  } finally {
    shouldSimulateRollback = false;
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` MODULE 2 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runModule2Tests().catch((err) => {
  console.error("Module 2 test suite threw unhandled exception:", err);
  process.exit(1);
});
