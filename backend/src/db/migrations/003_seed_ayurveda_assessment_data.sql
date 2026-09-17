-- Migration: 003_seed_ayurveda_assessment_data.sql
-- Module 2: Seed Ayurveda Competencies, Assessment Template, 26 Questions & 13 MCQ Answer Keys

-- =============================================================================
-- 1. SEED DEFAULT INSTITUTIONS & ORGANIZATIONS (Reference platform metadata)
-- =============================================================================

INSERT INTO public.institutions (name, code, category, location, verification_status)
VALUES
  ('All India Institute of Ayurveda (AIIA)', 'AIIA-DEL', 'National Institute', 'New Delhi, Delhi', 'approved'),
  ('National Institute of Ayurveda (NIA)', 'NIA-JAI', 'National Institute', 'Jaipur, Rajasthan', 'approved'),
  ('Institute of Teaching and Research in Ayurveda (ITRA)', 'ITRA-JAM', 'Institute of National Importance', 'Jamnagar, Gujarat', 'approved'),
  ('Faculty of Ayurveda, IMS, BHU', 'BHU-AYU', 'Central University', 'Varanasi, Uttar Pradesh', 'approved'),
  ('Government Ayurvedic College and Hospital', 'GACH-PAT', 'Government College', 'Patna, Bihar', 'approved')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.organizations (name, organization_type, location, verification_status)
SELECT v.name, v.org_type, v.location, 'approved'
FROM (
  VALUES
    ('Dabur India Ltd (Ayurveda Healthcare Division)', 'Ayurvedic Pharmaceutical Manufacturer', 'Ghaziabad, Uttar Pradesh'),
    ('Himalaya Wellness Company', 'Ayurvedic Wellness & Phytopharmaceuticals', 'Bengaluru, Karnataka'),
    ('Patanjali Research Foundation', 'Research & Manufacturing', 'Haridwar, Uttarakhand'),
    ('Baidyanath Ayurved Bhawan', 'Classical & Patent Ayurvedic Medicines', 'Kolkata, West Bengal'),
    ('Kottakkal Arya Vaidya Sala', 'Classical Ayurvedic Clinical Healthcare', 'Kottakkal, Kerala')
) AS v(name, org_type, location)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.name = v.name
);

-- =============================================================================
-- 2. SEED DEFAULT SKILLS (Core Ayurvedic & Clinical skills)
-- =============================================================================

INSERT INTO public.skills (name, category, description, source, is_active)
SELECT v.name, v.category, v.description, v.source, true
FROM (
  VALUES
    ('Nadi Pariksha (Ayurvedic Pulse Examination)', 'Clinical Diagnosis', 'Skill in examining radial pulse characteristics according to Tridosha states.', 'NCISM Curriculum'),
    ('Prakriti Assessment', 'Ayurvedic Foundations', 'Systematic assessment of anatomical, physiological, and psychological Doshic constitution.', 'NCISM Curriculum'),
    ('Panchakarma Procedure Administration', 'Therapeutics', 'Supervising and administering classical shodhana therapeutic modalities.', 'NCISM Curriculum'),
    ('Ayurvedic Pharmacognosy & Dravyaguna', 'Pharmacology', 'Identification and therapeutic correlation of medicinal plant formulations.', 'NCISM Curriculum'),
    ('Modern Clinical Vitals Assessment', 'Contemporary Medical', 'Accurate recording and clinical interpretation of blood pressure, SpO2, temperature, and vitals.', 'Integrated Medical Sciences'),
    ('Ayush Good Clinical Practice (GCP)', 'Research & Ethics', 'Adherence to ethical standards and protocol guidelines in Ayush biomedical research.', 'Ministry of Ayush Guidelines')
) AS v(name, category, description, source)
WHERE NOT EXISTS (
  SELECT 1 FROM public.skills s WHERE s.name = v.name
);

-- =============================================================================
-- 3. SEED THE 13 AYURVEDA COMPETENCIES (Strictly preserved canonical set)
-- =============================================================================

INSERT INTO public.competencies (
  name,
  category,
  description,
  source,
  source_reference,
  is_active
)
SELECT
  v.name,
  v.category,
  v.description,
  v.source,
  v.source_reference,
  true
FROM (
  VALUES
    -- Academic / Domain
    (
      'Ayurvedic Foundational Understanding',
      'academic_domain',
      'Understanding fundamental concepts and principles of Ayurveda.',
      'NCISM BAMS Curriculum',
      'https://ncismindia.org/ (NCISM Competency Based Dynamic Curriculum for BAMS)'
    ),
    (
      'Application of Ayurvedic Concepts',
      'academic_domain',
      'Applying learned Ayurvedic principles in relevant academic or practical contexts.',
      'NCISM BAMS Curriculum',
      'https://ncismindia.org/ (NCISM Competency Based Dynamic Curriculum for BAMS)'
    ),
    (
      'Contemporary Medical Understanding',
      'academic_domain',
      'Understanding relevant contemporary medical concepts alongside Ayurvedic learning.',
      'Platform-defined competency derived from official sources',
      'Derived from integrated contemporary science subjects in NCISM BAMS Curriculum (https://ncismindia.org/)'
    ),

    -- Clinical / Practical
    (
      'Clinical History and Examination',
      'clinical_practical',
      'Ability to gather relevant clinical information and perform appropriate clinical examination.',
      'NCISM Shishiksha (Internship Orientation Programme)',
      'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
    ),
    (
      'Clinical Interpretation',
      'clinical_practical',
      'Ability to interpret relevant clinical findings and diagnostic information.',
      'NCISM Shishiksha (Internship Orientation Programme)',
      'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
    ),
    (
      'Patient Communication',
      'clinical_practical',
      'Ability to communicate clearly and appropriately with patients.',
      'NCISM Shishiksha (Internship Orientation Programme)',
      'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
    ),
    (
      'Clinical Documentation and Record Keeping',
      'clinical_practical',
      'Ability to maintain accurate clinical information and records.',
      'NCISM Shishiksha (Internship Orientation Programme)',
      'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
    ),

    -- Research
    (
      'Research Methodology',
      'research',
      'Understanding fundamental research methodology.',
      'NCISM Research Methodology & Medical Statistics Curriculum',
      'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
    ),
    (
      'Statistical Understanding',
      'research',
      'Understanding basic statistical concepts used in research.',
      'NCISM Research Methodology & Medical Statistics Curriculum',
      'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
    ),
    (
      'Evidence-Based Practice',
      'research',
      'Ability to understand and use relevant evidence to support professional learning and practice.',
      'NCISM Research Methodology & Medical Statistics Curriculum',
      'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
    ),
    (
      'Scientific Communication',
      'research',
      'Ability to communicate research findings in a clear scientific format.',
      'NCISM Research Methodology & Medical Statistics Curriculum',
      'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
    ),

    -- Professional
    (
      'Professional Ethics and Conduct',
      'professional',
      'Demonstrating ethical and professional behaviour.',
      'NCISM Shishiksha (Internship Orientation Programme)',
      'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
    ),
    (
      'Teamwork and Professional Communication',
      'professional',
      'Ability to communicate and work effectively in professional teams.',
      'NCISM Shishiksha (Internship Orientation Programme)',
      'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
    )
) AS v(name, category, description, source, source_reference)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 4. SEED ASSESSMENT TEMPLATE, 26 QUESTIONS & 13 ANSWER KEYS
-- =============================================================================

DO $$
DECLARE
  v_template_id uuid;

  -- Competency IDs
  v_comp_foundations uuid;
  v_comp_concepts uuid;
  v_comp_contemporary uuid;
  v_comp_history uuid;
  v_comp_interpretation uuid;
  v_comp_patient_comm uuid;
  v_comp_documentation uuid;
  v_comp_research_method uuid;
  v_comp_statistics uuid;
  v_comp_ebp uuid;
  v_comp_sci_comm uuid;
  v_comp_ethics uuid;
  v_comp_teamwork uuid;

  -- Question IDs for MCQs to link answer keys
  v_q1_id uuid;
  v_q3_id uuid;
  v_q5_id uuid;
  v_q7_id uuid;
  v_q9_id uuid;
  v_q11_id uuid;
  v_q13_id uuid;
  v_q15_id uuid;
  v_q17_id uuid;
  v_q19_id uuid;
  v_q21_id uuid;
  v_q23_id uuid;
  v_q25_id uuid;

  -- Standard 5-point self-rating options JSON
  v_self_rating_options jsonb := '[
    {"value": 1, "label": "Very Low"},
    {"value": 2, "label": "Low"},
    {"value": 3, "label": "Moderate"},
    {"value": 4, "label": "High"},
    {"value": 5, "label": "Very High"}
  ]'::jsonb;

BEGIN
  -- Resolve Competency IDs
  SELECT id INTO v_comp_foundations FROM public.competencies WHERE name = 'Ayurvedic Foundational Understanding';
  SELECT id INTO v_comp_concepts FROM public.competencies WHERE name = 'Application of Ayurvedic Concepts';
  SELECT id INTO v_comp_contemporary FROM public.competencies WHERE name = 'Contemporary Medical Understanding';
  SELECT id INTO v_comp_history FROM public.competencies WHERE name = 'Clinical History and Examination';
  SELECT id INTO v_comp_interpretation FROM public.competencies WHERE name = 'Clinical Interpretation';
  SELECT id INTO v_comp_patient_comm FROM public.competencies WHERE name = 'Patient Communication';
  SELECT id INTO v_comp_documentation FROM public.competencies WHERE name = 'Clinical Documentation and Record Keeping';
  SELECT id INTO v_comp_research_method FROM public.competencies WHERE name = 'Research Methodology';
  SELECT id INTO v_comp_statistics FROM public.competencies WHERE name = 'Statistical Understanding';
  SELECT id INTO v_comp_ebp FROM public.competencies WHERE name = 'Evidence-Based Practice';
  SELECT id INTO v_comp_sci_comm FROM public.competencies WHERE name = 'Scientific Communication';
  SELECT id INTO v_comp_ethics FROM public.competencies WHERE name = 'Professional Ethics and Conduct';
  SELECT id INTO v_comp_teamwork FROM public.competencies WHERE name = 'Teamwork and Professional Communication';

  -- Create or Resolve Assessment Template
  SELECT id INTO v_template_id
  FROM public.assessment_templates
  WHERE title = 'Ayush Skill & Competency Assessment';

  IF v_template_id IS NULL THEN
    INSERT INTO public.assessment_templates (
      title,
      description,
      program,
      year,
      status,
      published_at,
      created_by
    ) VALUES (
      'Ayush Skill & Competency Assessment',
      'An initial competency assessment designed to understand a learner''s academic, clinical, research and professional skill profile and identify areas for development.',
      'BAMS / Ayurveda',
      NULL,
      'published',
      now(),
      NULL
    )
    RETURNING id INTO v_template_id;
  END IF;

  -- Skip question insertion if template already has questions populated
  IF EXISTS (SELECT 1 FROM public.assessment_questions WHERE assessment_template_id = v_template_id) THEN
    RETURN;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Competency 1: Ayurvedic Foundational Understanding
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_foundations,
    'When explaining the core Ayurvedic principle of Samanya and Vishesha in an academic seminar, which statement accurately reflects its foundational concept?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Similarity causes increase of like qualities, whereas dissimilarity leads to decrease."},
      {"value": "B", "label": "All bodily elements decrease when exposed to identical environmental attributes."},
      {"value": "C", "label": "Qualities naturally balance each other without any relationship to dietary substances."},
      {"value": "D", "label": "Opposing attributes always cause an immediate increase in internal bodily tissues."}
    ]'::jsonb,
    'NCISM BAMS Curriculum',
    'https://ncismindia.org/ (NCISM Competency Based Dynamic Curriculum for BAMS)'
  ) RETURNING id INTO v_q1_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_foundations,
    'Rate your level of confidence in explaining fundamental Ayurvedic concepts and principles (such as Tridosha, Dhatu, and Triguna) to peers or educators.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM BAMS Curriculum',
    'https://ncismindia.org/ (NCISM Competency Based Dynamic Curriculum for BAMS)'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 2: Application of Ayurvedic Concepts
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_concepts,
    'During a clinical case discussion on seasonal health management (Ritucharya), a student observes aggravated Vata characteristics in an elderly individual during early winter (Hemanta). Applying Ayurvedic dietary principles, what is the most appropriate recommendation?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Advise predominantly dry, cold, and astringent foods to suppress digestive fire."},
      {"value": "B", "label": "Recommend warm, unctuous (Snigdha), and nourishing meals with sweet, sour, and salty tastes."},
      {"value": "C", "label": "Advise strict prolonged fasting without any warm fluids or herbal decoctions."},
      {"value": "D", "label": "Recommend excessive intake of bitter herbs with strictly raw, cold vegetables."}
    ]'::jsonb,
    'NCISM BAMS Curriculum',
    'https://ncismindia.org/ (NCISM Competency Based Dynamic Curriculum for BAMS)'
  ) RETURNING id INTO v_q3_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_concepts,
    'Rate your level of confidence in applying learned Ayurvedic principles (such as Ahara-Vihara guidelines, Agni assessment, and Prakriti analysis) in academic and clinical case discussions.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM BAMS Curriculum',
    'https://ncismindia.org/ (NCISM Competency Based Dynamic Curriculum for BAMS)'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 3: Contemporary Medical Understanding
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_contemporary,
    'Why is integrating relevant contemporary medical knowledge (such as human physiology, routine laboratory investigations, and red-flag symptoms) essential for an Ayurvedic healthcare learner?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "To completely replace classical Ayurvedic diagnostic frameworks with conventional algorithms."},
      {"value": "B", "label": "To eliminate the necessity of performing classical pulse and physical examinations."},
      {"value": "C", "label": "To recognize emergency signs, understand investigation reports, and ensure safe patient care alongside Ayurvedic practice."},
      {"value": "D", "label": "To prescribe conventional synthetic pharmaceuticals independently without statutory authorization."}
    ]'::jsonb,
    'Platform-defined competency derived from official sources',
    'Derived from integrated contemporary science subjects in NCISM BAMS Curriculum (https://ncismindia.org/)'
  ) RETURNING id INTO v_q5_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_contemporary,
    'Rate your level of confidence in understanding relevant contemporary medical concepts (such as routine lab reports, vital signs, and modern pathophysiology) alongside your Ayurvedic studies.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'Platform-defined competency derived from official sources',
    'Derived from integrated contemporary science subjects in NCISM BAMS Curriculum (https://ncismindia.org/)'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 4: Clinical History and Examination
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_history,
    'When beginning a structured clinical history and physical examination of a newly admitted patient, what is the most appropriate initial step?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Immediately prescribe therapeutic formulations before recording chief complaints."},
      {"value": "B", "label": "Confirm patient identity, establish respectful rapport, and record the chief complaint with its chronological onset."},
      {"value": "C", "label": "Perform localized physical palpation without obtaining verbal consent or introducing oneself."},
      {"value": "D", "label": "Direct the patient to laboratory investigations prior to obtaining presenting symptoms."}
    ]'::jsonb,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  ) RETURNING id INTO v_q7_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_history,
    'Rate your level of confidence in taking a structured clinical history (including chief complaints, history of present illness) and performing an appropriate clinical examination.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 5: Clinical Interpretation
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_interpretation,
    'A patient presents with persistent joint discomfort, morning stiffness, impaired appetite (Agnimandya), and a coated tongue. How should a clinician interpret these combined findings before formulating a diagnostic conclusion?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Conclude pure mechanical joint trauma and disregard the metabolic symptoms."},
      {"value": "B", "label": "Ignore the digestive complaints as they have no relationship with musculoskeletal manifestations."},
      {"value": "C", "label": "Assume infectious arthritis without correlating signs, duration, or systemic factors."},
      {"value": "D", "label": "Synthesize both systemic indicators (Ama and Agni impairment) and localized articular signs to evaluate the disease stage."}
    ]'::jsonb,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  ) RETURNING id INTO v_q9_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_interpretation,
    'Rate your level of confidence in interpreting relevant clinical findings, symptom patterns, and diagnostic reports to understand a patient''s condition.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 6: Patient Communication
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_patient_comm,
    'An anxious patient asks multiple questions about the duration and dietary restrictions of their prescribed Ayurvedic treatment. What is the most professional communication response?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Listen patiently, address their concerns in simple non-technical language, and confirm their understanding."},
      {"value": "B", "label": "Dismiss the patient''s concerns as unnecessary and ask them to follow the prescription silently."},
      {"value": "C", "label": "Provide brief complex medical terminology and terminate the consultation immediately."},
      {"value": "D", "label": "Delegate communication entirely to hospital staff without offering direct clarification."}
    ]'::jsonb,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  ) RETURNING id INTO v_q11_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_patient_comm,
    'Rate your level of confidence in communicating clearly, empathetically, and respectfully with patients from diverse backgrounds.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 7: Clinical Documentation and Record Keeping
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_documentation,
    'Why is maintaining timely, accurate, and legible clinical documentation (such as case sheets, daily progress notes, and e-logbooks) vital in clinical practice?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "It serves solely as an administrative formality with no impact on clinical decision-making."},
      {"value": "B", "label": "It is only necessary when a clinical research trial is actively taking place."},
      {"value": "C", "label": "It ensures continuity of care, facilitates multidisciplinary communication, and provides an authentic medico-legal record."},
      {"value": "D", "label": "It allows clinical staff to alter past diagnostic notes whenever treatment outcomes vary."}
    ]'::jsonb,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  ) RETURNING id INTO v_q13_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_documentation,
    'Rate your level of confidence in maintaining structured, accurate clinical records, case documentation, and hospital management logs.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 8: Research Methodology
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_research_method,
    'In the systematic design of a clinical or observational Ayurvedic research study, what is considered an essential foundational step before selecting methodology and gathering data?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Finalizing data analysis graphs prior to formulating hypotheses."},
      {"value": "B", "label": "Formulating a clear, focused research question and well-defined primary objectives based on literature review."},
      {"value": "C", "label": "Publishing study conclusions before establishing inclusion criteria."},
      {"value": "D", "label": "Purchasing laboratory reagents without identifying study endpoints or design."}
    ]'::jsonb,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  ) RETURNING id INTO v_q15_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_research_method,
    'Rate your level of confidence in understanding the basic steps of research methodology (such as study design, hypothesis formulation, and literature review).',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 9: Statistical Understanding
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_statistics,
    'What is the primary role of applying statistical methods to clinical research data in health sciences?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "To fabricate positive statistical outcomes when clinical results are non-significant."},
      {"value": "B", "label": "To replace the need for maintaining raw observational records during clinical trials."},
      {"value": "C", "label": "To ensure that every clinical study guarantees identical therapeutic efficacy for all subjects."},
      {"value": "D", "label": "To organize data objectively, quantify variability, and evaluate whether observed treatment effects are likely due to chance."}
    ]'::jsonb,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  ) RETURNING id INTO v_q17_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_statistics,
    'Rate your level of confidence in understanding basic statistical concepts (such as mean, standard deviation, p-value, and sample size) used in research studies.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 10: Evidence-Based Practice
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_ebp,
    'A clinician reads an online promotional article claiming a single Ayurvedic herb cures chronic metabolic disorders. Applying evidence-based practice principles, how should the clinician evaluate this claim?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Critically appraise the claim by reviewing peer-reviewed clinical trials, safety data, and classical textual evidence."},
      {"value": "B", "label": "Accept the claim unconditionally and immediately incorporate it into routine clinical prescriptions."},
      {"value": "C", "label": "Forward the promotional material to patients before verifying any scientific literature."},
      {"value": "D", "label": "Disregard all classical literature and scientific publications regarding the formulation."}
    ]'::jsonb,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  ) RETURNING id INTO v_q19_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_ebp,
    'Rate your level of confidence in finding, critically reading, and using relevant scientific evidence and classical references to inform your learning and clinical decisions.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 11: Scientific Communication
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_sci_comm,
    'When preparing a scientific manuscript or presenting research findings at an academic conference, which principle ensures clear and transparent communication?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Omit study limitations and report only favorable data points."},
      {"value": "B", "label": "Use obscure, undefined acronyms without citing referenced literature."},
      {"value": "C", "label": "Follow a standard structure (Introduction, Methods, Results, Discussion) with honest reporting of methodology and findings."},
      {"value": "D", "label": "Present preliminary anecdotal observations as conclusive randomized controlled trial evidence."}
    ]'::jsonb,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  ) RETURNING id INTO v_q21_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_sci_comm,
    'Rate your level of confidence in communicating research observations, case reports, or study findings in a clear, structured scientific format (written or oral).',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Research Methodology & Medical Statistics Curriculum',
    'https://ncismindia.org/8.%20NCISM_IIIBAMS_AyUG-RM.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 12: Professional Ethics and Conduct
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_ethics,
    'During clinical posting, an intern is asked by a close acquaintance to share medical records and diagnosis details of a hospitalized patient without the patient''s consent. What is the ethically appropriate action?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Disclose the patient''s medical details informally since the requester is an acquaintance."},
      {"value": "B", "label": "Politely decline and uphold patient confidentiality in accordance with medical ethics standards."},
      {"value": "C", "label": "Post an anonymized image of the patient''s diagnostic chart on public social media."},
      {"value": "D", "label": "Provide the physical case sheet file to the acquaintance for private examination."}
    ]'::jsonb,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  ) RETURNING id INTO v_q23_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_ethics,
    'Rate your level of confidence in adhering to professional ethics, patient confidentiality, informed consent, and professional conduct standards.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- Competency 13: Teamwork and Professional Communication
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_teamwork,
    'During an interprofessional ward round, a disagreement arises between clinical team members regarding the scheduling of Panchakarma procedures. What is the most effective approach to resolve the issue?',
    'mcq', 1.0, 1.0,
    '[
      {"value": "A", "label": "Ignore other team perspectives and carry out unapproved interventions unilaterally."},
      {"value": "B", "label": "Cease communicating with team members and abandon responsibility for patient monitoring."},
      {"value": "C", "label": "Publicly argue in front of patients and hospital visitors to defend one''s viewpoint."},
      {"value": "D", "label": "Engage in constructive, respectful dialogue focused on the patient''s safety, clinical status, and consensus."}
    ]'::jsonb,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  ) RETURNING id INTO v_q25_id;

  INSERT INTO public.assessment_questions (
    assessment_template_id, competency_id, question, question_type, weight, max_score, options, source, source_reference
  ) VALUES (
    v_template_id, v_comp_teamwork,
    'Rate your level of confidence in communicating constructively and working effectively within a multidisciplinary healthcare or academic team.',
    'self_rating', 0.25, 1.0,
    v_self_rating_options,
    'NCISM Shishiksha (Internship Orientation Programme)',
    'https://ncismindia.org/assets/pdf/SHISHIKSHA%20%28INTERSHIP%20ORIENTATION%20PROGRAM%29.pdf'
  );

  -- ---------------------------------------------------------------------------
  -- 5. INSERT ANSWER KEYS FOR THE 13 MCQS ONLY
  -- ---------------------------------------------------------------------------
  INSERT INTO public.assessment_question_keys (question_id, correct_answer)
  VALUES
    (v_q1_id,  '{"value": "A"}'::jsonb),
    (v_q3_id,  '{"value": "B"}'::jsonb),
    (v_q5_id,  '{"value": "C"}'::jsonb),
    (v_q7_id,  '{"value": "B"}'::jsonb),
    (v_q9_id,  '{"value": "D"}'::jsonb),
    (v_q11_id, '{"value": "A"}'::jsonb),
    (v_q13_id, '{"value": "C"}'::jsonb),
    (v_q15_id, '{"value": "B"}'::jsonb),
    (v_q17_id, '{"value": "D"}'::jsonb),
    (v_q19_id, '{"value": "A"}'::jsonb),
    (v_q21_id, '{"value": "C"}'::jsonb),
    (v_q23_id, '{"value": "B"}'::jsonb),
    (v_q25_id, '{"value": "D"}'::jsonb);

END $$;
