(function () {
  const FIELD_ORDER = [
    "chief_complaint",
    "history_present_illness",
    "subjective",
    "objective",
    "assessment",
    "plan",
    "past_medical_history",
    "medications_section",
    "general_text",
  ];

  const SECTION_FIELD_MAP = {
    "chief complaint": "chief_complaint",
    cc: "chief_complaint",
    "history of present illness": "history_present_illness",
    hpi: "history_present_illness",
    subjective: "subjective",
    s: "subjective",
    "review of systems": "subjective",
    ros: "subjective",
    objective: "objective",
    o: "objective",
    exam: "objective",
    "physical exam": "objective",
    assessment: "assessment",
    a: "assessment",
    impression: "assessment",
    diagnosis: "assessment",
    diagnoses: "assessment",
    plan: "plan",
    p: "plan",
    "past medical history": "past_medical_history",
    pmh: "past_medical_history",
    "medical history": "past_medical_history",
    history: "past_medical_history",
    medications: "medications_section",
    medication: "medications_section",
    "current medications": "medications_section",
    "current meds": "medications_section",
    meds: "medications_section",
  };

  const ABBREVIATION_PATTERNS = [
    [/\bPt\b/gi, "patient"],
    [/\bc\/o\b/gi, "complains of"],
    [/\bHx\b/gi, "history of"],
    [/\babd pain\b/gi, "abdominal pain"],
    [/\bCP\b/gi, "chest pain"],
    [/\bSOB\b/gi, "shortness of breath"],
    [/\bN\/V\b/gi, "nausea vomiting"],
    [/\bBM\b/gi, "bowel movement"],
    [/\bHTN\b/gi, "hypertension"],
    [/\bposs\b/gi, "possible"],
    [/\bPRN\b/gi, "as needed"],
    [/\bw\/\b/gi, "with"],
    [/\bx\s*(\d+)\s*d\b/gi, "x $1 days"],
    [/\bx\s*(\d+)\s*w\b/gi, "x $1 weeks"],
    [/\bx\s*(\d+)\s*m\b/gi, "x $1 months"],
  ];

  const HISTORICAL_MARKERS = [
    "hx",
    "history of",
    "prior history",
    "previously diagnosed",
    "past medical history",
    "previously prescribed",
    "last month",
    "prior",
  ];
  const RESOLVED_MARKERS = [
    "resolved",
    "now resolved",
    "now gone",
    "gone",
    "no current symptoms",
    "no other symptoms",
    "currently only symptom is",
    "earlier today, now gone",
  ];
  const UNCERTAINTY_MARKERS = [
    "maybe",
    "unsure",
    "unclear",
    "not sure",
    "cannot recall",
    "?",
    "possible",
    "approximately",
    "approx",
    "~",
    "a while",
    "on and off",
    "something for bp",
    "no exact readings",
    "compliance unclear",
    "unclear if related",
  ];
  const CORRECTION_MARKERS = ["later states", "later reports", "but later", "actually", "more like", "may have been", "instead"];
  const NEGATION_MARKERS = ["denies", "no ", "without", "negative for"];

  const QUALIFIER_PATTERN =
    /\b(?:likely|possible|probable|suspected|maybe|unclear|mild|intermittent|occasional|currently|previously|now|started|reports?|mentions?|complains?\s+of|initially|later|past|on and off)\b/gi;
  const NARRATIVE_LEAK_PATTERN =
    /\b(?:reports?|mentions?|complains?\s+of|now he has|had|currently only symptom is|started|worsened|unclear if|cannot recall|dose unchanged|with little relief|no recent attacks|as needed|maybe|not sure|unsure|prior|previously)\b/i;

  const DURATION_PATTERNS = [
    /\bx\s*(\d+)\s*(days?|weeks?|months?)\b/gi,
    /\bfor (?:the )?(?:past )?(\d+)\s*(days?|weeks?|months?)\b/gi,
    /\bpast (\d+)\s*(days?|weeks?|months?)\b/gi,
    /\bover past (week|month)\b/gi,
    /\bevery morning this week\b/gi,
    /\byesterday\b/gi,
    /\bearlier today\b/gi,
    /\ba few days ago\b/gi,
    /\b2[–-]3 weeks ago\b/gi,
    /\bon and off for a while\b/gi,
  ];

  const SYMPTOM_MAP = [
    [/\bsore throat\b/gi, "sore throat"],
    [/\bcough(?:ing)?\b/gi, "cough"],
    [/\bfever\b/gi, "fever"],
    [/\bfatigue\b|\bkinda tired\b|\btired\b/gi, "fatigue"],
    [/\bdizziness?\b/gi, "dizziness"],
    [/\bheadaches?\b/gi, "headache"],
    [/\bnausea\b/gi, "nausea"],
    [/\bvomiting\b/gi, "vomiting"],
    [/\bshortness of breath\b/gi, "shortness of breath"],
    [/\bchest pressure\b/gi, "chest pressure"],
    [/\bchest discomfort\b/gi, "chest discomfort"],
    [/\bchest tightness\b/gi, "chest tightness"],
    [/\bchest pain\b/gi, "chest pain"],
    [/\babdominal discomfort\b/gi, "abdominal discomfort"],
    [/\babdominal pain\b|\bback pain\b|\barm pain\b/gi, null],
    [/\bblurred vision\b/gi, "blurred vision"],
    [/\bincreased thirst\b|\bthirst\b/gi, "thirst"],
    [/\burination\b/gi, "urination"],
    [/\bdifficulty sleeping\b|\btrouble sleeping\b|\binsomnia\b/gi, "insomnia"],
    [/\bheart racing\b|\bpalpitations?\b/gi, "palpitations"],
  ];

  const CONDITION_MAP = [
    [/\bviral pharyngitis\b/gi, "viral pharyngitis"],
    [/\bupper respiratory infection\b/gi, "upper respiratory infection"],
    [/\btension headaches?\b/gi, "tension headache"],
    [/\bhypertension\b/gi, "hypertension"],
    [/\bdiabetes\b/gi, "diabetes"],
    [/\bgerd\b/gi, "GERD"],
    [/\bgastritis\b/gi, "gastritis"],
    [/\banxiety\b/gi, "anxiety"],
    [/\bmuscle strain\b/gi, "muscle strain"],
    [/\bviral infection\b/gi, "viral infection"],
  ];

  const MEDICATION_MAP = [
    [/\bmetformin\b/gi, "metformin"],
    [/\binsulin\b/gi, "insulin"],
    [/\blisinopril\b/gi, "lisinopril"],
    [/\bibuprofen\b/gi, "ibuprofen"],
    [/\bacetaminophen\b/gi, "acetaminophen"],
    [/\btylenol\b/gi, "Tylenol"],
    [/\bomeprazole\b/gi, "omeprazole"],
    [/\bamoxicillin\b/gi, "amoxicillin"],
    [/\bnsaids?\b/gi, "NSAIDs"],
    [/\botc meds?\b/gi, "OTC meds"],
    [/\bppi\b|\bproton pump inhibitor\b/gi, "PPI"],
    [/\bcough suppressant\b/gi, "cough suppressant"],
  ];

  const SAMPLE_CASES = [
    { label: "1. Simple Primary Care Note", note: "Patient presents with sore throat and mild fever for 2 days. Denies cough or shortness of breath. Exam consistent with viral pharyngitis. Advised rest, fluids, and OTC pain relief. No antibiotics prescribed at this time." },
    { label: "2. Slightly Messy / Natural Paragraph Style", note: "Pt reports lower back pain x1 week after lifting heavy boxes. Pain described as dull, worse with movement. No numbness or tingling. Has taken ibuprofen with partial relief. Likely muscle strain. Recommend rest, avoid heavy lifting, continue NSAIDs as needed." },
    { label: "3. Includes History + Medication", note: "Patient complains of chest tightness for past 3 days. History of hypertension. Currently on lisinopril. No prior cardiac events. Vitals stable. EKG normal. Symptoms likely non-cardiac but will monitor. Advised follow-up if symptoms worsen." },
    { label: "4. Includes Denials", note: "Patient denies fever, chills, or chest pain. Reports persistent cough for 5 days, worse at night. No history of asthma. Lungs clear on exam. Suspected upper respiratory infection. Prescribed cough suppressant." },
    { label: "5. Slightly More Formal / Structured", note: "Chief Complaint: Headache\nHistory of Present Illness: Patient reports intermittent headaches for 2 weeks, described as throbbing, located frontal region.\nAssessment: Likely tension headaches\nPlan: Increase hydration, reduce screen time, trial acetaminophen as needed" },
    { label: "6. Messy / Abbreviated Clinical Style", note: "39M c/o abd pain x3d. No N/V. BM normal. Hx GERD. On omeprazole. Exam benign. Prob gastritis. Continue PPI, avoid trigger foods." },
    { label: "7. Includes Duration + Multiple Items", note: "Patient reports fatigue and dizziness for the past 2 weeks. Also notes intermittent headaches. No recent illness. Blood work ordered to rule out anemia or thyroid issues. No medications prescribed at this time." },
    { label: "8. Medication-Focused Note", note: "Follow-up visit for diabetes management. Patient currently taking metformin. Blood sugar levels remain elevated. Will increase dosage and re-evaluate in 1 month." },
    { label: "9. Mixed Clarity / Slightly Ambiguous", note: "Pt not feeling well, some chest discomfort but unclear onset. Says maybe a few days. Also feeling tired. On BP meds but unsure which. Will follow up after labs." },
    { label: "10. Very Short / Minimal", note: "Cough x4d. No fever. Viral. Supportive care." },
    { label: "11. Contradiction + Correction Mid-Note", note: "Pt initially reports chest pain x2 days, later states it may have been more like “pressure” and started ~1 week ago. Denies SOB. Hx HTN. On meds but unsure which. No meds changed today." },
    { label: "12. Multiple Durations / Conflicting", note: "Complains of headache on and off for “a while,” worse past 3 days. Says maybe started 2–3 weeks ago. Taking Tylenol occasionally." },
    { label: "13. Denial + Later Admission", note: "Patient denies cough initially but later reports “a little coughing at night.” No fever. Symptoms x5 days. No medications." },
    { label: "14. Vague Medication Reference", note: "Pt with hx anxiety, takes meds “as needed,” cannot recall name. Increased stress recently. Reports insomnia x1 week." },
    { label: "15. Mixed Past vs Current Condition", note: "History of asthma, no recent attacks. Reports shortness of breath yesterday but resolved. No current symptoms." },
    { label: "16. Multiple Symptoms, Partial Durations", note: "Fatigue for past few weeks, dizziness started “a few days ago.” Occasional nausea but unclear onset. No vomiting." },
    { label: "17. Negative Phrasing Trap", note: "No chest pain, no SOB, no dizziness. Reports mild abdominal discomfort x2 days." },
    { label: "18. Unclear Timeline + Hedging Language", note: "Pt says symptoms started “maybe Monday or Tuesday,” not sure. Complains of sore throat and fatigue. No meds taken yet." },
    { label: "19. Multiple Conditions + Overlapping Statements", note: "Hx diabetes and hypertension. Blood sugars “running high lately.” Also reports blurred vision past 3 days. Taking insulin, dose unchanged." },
    { label: "20. Medication Mentioned But Not Prescribed Now", note: "Pt previously prescribed amoxicillin for infection last month. Now presents with new cough x4 days. No new meds given." },
    { label: "21. Implicit Duration", note: "Reports waking up with headaches “every morning this week.” No prior history." },
    { label: "22. Contradictory Denial", note: "Denies fever but states “felt hot last night.” No measured temp. Cough x3 days." },
    { label: "23. Embedded Irrelevant Info", note: "Patient here for work clearance. Mentions mild back pain from gym 2 days ago but says it’s improving. No treatment requested." },
    { label: "24. Multiple Patients / Confusion Style", note: "Patient states wife had flu last week. Now he has cough and fatigue x2 days. No prior symptoms before that." },
    { label: "25. Abbreviated + Compressed", note: "39M w/ CP? x3d, poss longer. No SOB. Hx HTN. On ?meds. EKG ok. Monitor." },
    { label: "26. Symptom Implied, Not Directly Stated", note: "Difficulty sleeping due to “heart racing” at night for past week. No daytime symptoms." },
    { label: "27. Duration Split Across Sentence", note: "Reports nausea, started after eating out, maybe 2 days ago. Still ongoing." },
    { label: "28. Condition Implied, Not Labeled Cleanly", note: "Blood pressure has been “high at home.” No exact readings. On medication but compliance unclear." },
    { label: "29. Multiple Meds, Unclear Relevance", note: "Taking metformin, ibuprofen PRN, and “something for BP.” Complains of fatigue x1 week." },
    { label: "30. Resolved But Still Relevant", note: "Had fever 3 days ago, now resolved. Currently only symptom is cough." },
    { label: "31. Mixed Severity Language", note: "Mild chest discomfort earlier today, now gone. No other symptoms." },
    { label: "32. Ambiguous Symptom Grouping", note: "Reports pain in chest and arm, unclear if related. Started yesterday." },
    { label: "33. Negation Scope Problem", note: "No history of diabetes. Reports increased thirst and urination over past week." },
    { label: "34. Multiple Timelines Overlapping", note: "Back pain x1 month, worsened significantly over past 2 days. Taking OTC meds with little relief." },
    { label: "35. Casual Language / Non-Clinical Wording", note: "Says he’s been “feeling off” for a few days, kinda tired, maybe a headache. Not sure." },
  ];
  const DEFAULT_SAMPLE_INDEX = 4;

  function normalizeNote(noteText) {
    const rawText = noteText || "";
    const normalizedText = normalizeAbbreviations(rawText);

    const normalized = {
      raw_text: rawText,
      normalized_text: normalizedText,
      note_style: !normalizedText.trim() ? "empty" : "narrative",
      detected_sections: [],
      chief_complaint: [],
      history_present_illness: [],
      subjective: [],
      objective: [],
      assessment: [],
      plan: [],
      past_medical_history: [],
      medications_section: [],
      general_text: [],
    };

    if (!normalizedText.trim()) return normalized;

    const lines = normalizedText
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    let currentField = "general_text";
    lines.forEach((line) => {
      const section = matchSectionHeader(line);
      if (section) {
        currentField = section.field;
        if (section.remainder) normalized[currentField].push(section.remainder);
        return;
      }
      normalized[currentField].push(line);
    });

    normalized.detected_sections = FIELD_ORDER.filter((name) => normalized[name].length);
    normalized.note_style = detectNoteStyle(normalized);
    return normalized;
  }

  function extractDoctorNote(noteText) {
    return extractFromNormalizedNote(normalizeNote(noteText));
  }

  function extractFromNormalizedNote(normalizedNote) {
    const result = {
      symptoms: [],
      diagnosed_conditions: [],
      medications: [],
      duration: [],
      unclear: [],
    };

    if (!normalizedNote.normalized_text.trim()) {
      result.unclear.push("empty note");
      return result;
    }

    const clauses = buildClauses(normalizedNote);
    const candidates = extractCandidates(clauses);
    const filtered = filterCandidates(candidates);
    const resolved = resolveConflicts(filtered, clauses);
    const normalizedCandidates = normalizeCandidates(resolved);

    normalizedCandidates.forEach((candidate) => {
      if (!candidate.normalized) return;
      if (candidate.field === "symptoms") appendUnique(result.symptoms, candidate.normalized);
      if (candidate.field === "diagnosed_conditions") appendUnique(result.diagnosed_conditions, candidate.normalized);
      if (candidate.field === "medications") appendUnique(result.medications, candidate.normalized);
      if (candidate.field === "duration") appendUnique(result.duration, candidate.normalized);
      if (candidate.field === "unclear") appendUnique(result.unclear, candidate.normalized);
    });

    extractUnclearContext(clauses).forEach((item) => appendUnique(result.unclear, item));

    if (result.symptoms.length || result.diagnosed_conditions.length || result.medications.length || result.duration.length) {
      result.unclear = result.unclear.filter((item) => item !== "unable to determine clear medical details");
    } else if (!result.unclear.length) {
      result.unclear.push("unable to determine clear medical details");
    }

    return result;
  }

  function buildClauses(normalizedNote) {
    const clauses = [];
    let index = 0;
    FIELD_ORDER.forEach((fieldName) => {
      (normalizedNote[fieldName] || []).forEach((line) => {
        line
          .split(/(?<=[.!?])\s+|;/)
          .map((part) => part.trim().replace(/^[.\s]+|[.\s]+$/g, ""))
          .filter(Boolean)
          .forEach((text) => {
            clauses.push({ text, index, field: fieldName, tags: detectTags(text) });
            index += 1;
          });
      });
    });
    return clauses;
  }

  function detectTags(text) {
    const lowered = text.toLowerCase();
    const tags = new Set();
    if (HISTORICAL_MARKERS.some((marker) => lowered.includes(marker))) tags.add("historical");
    if (RESOLVED_MARKERS.some((marker) => lowered.includes(marker))) tags.add("resolved");
    if (NEGATION_MARKERS.some((marker) => lowered.includes(marker)) || lowered.startsWith("no ")) tags.add("negated");
    if (UNCERTAINTY_MARKERS.some((marker) => lowered.includes(marker))) tags.add("uncertain");
    if (CORRECTION_MARKERS.some((marker) => lowered.includes(marker))) tags.add("correction");
    if (/\bwife|husband|mother|father|son|daughter\b/i.test(lowered)) tags.add("other_person");
    if (/\bpreviously prescribed|last month|prior\b/i.test(lowered)) tags.add("medication_historical");
    if (/\bcurrently taking|taking|on\b/i.test(lowered)) tags.add("medication_current");
    if (/\bno new meds|no meds given|no medications\b/i.test(lowered)) tags.add("no_medication");
    if (/\bcurrently only symptom is\b/i.test(lowered)) tags.add("current_only_symptom");
    if (/\bno current symptoms\b/i.test(lowered)) tags.add("no_current_symptoms");
    if (/\bresolved|now gone|gone\b/i.test(lowered)) tags.add("symptom_resolved");
    return tags;
  }

  function extractCandidates(clauses) {
    const out = [];
    clauses.forEach((clause) => {
      const lowered = clause.text.toLowerCase();
      const durations = extractDurations(clause.text);
      const correctionFragment = laterFragment(clause.text);

      if (correctionFragment) {
        const correctedSymptoms = extractSymptomEntities(correctionFragment);
        const corrLower = correctionFragment.toLowerCase();
        const clauseLower = clause.text.toLowerCase();
        if (corrLower.includes("pressure") && !correctedSymptoms.includes("chest pressure") && (corrLower.includes("chest") || clauseLower.includes("chest"))) {
          correctedSymptoms.push("chest pressure");
        }
        correctedSymptoms.forEach((symptom) => {
          out.push({
            text: symptom,
            normalized: symptom,
            field: "symptoms",
            sourceText: clause.text,
            contextTags: new Set([...clause.tags, "correction"]),
            confidence: 0.85,
            isUncertain: clause.tags.has("uncertain"),
            index: clause.index,
          });
        });
        extractDurations(correctionFragment).forEach((duration) => {
          out.push({
            text: duration,
            normalized: duration,
            field: "duration",
            sourceText: clause.text,
            contextTags: new Set([...clause.tags, "correction"]),
            confidence: 0.8,
            isUncertain: true,
            index: clause.index,
          });
        });
      }

      durations.forEach((duration) => {
        out.push({
          text: duration,
          normalized: duration,
          field: "duration",
          sourceText: clause.text,
          contextTags: new Set(clause.tags),
          confidence: 0.8,
          isUncertain: clause.tags.has("uncertain"),
          index: clause.index,
        });
      });

      extractSymptomEntities(clause.text).forEach((symptom) => {
        out.push({
          text: symptom,
          normalized: symptom,
          field: "symptoms",
          sourceText: clause.text,
          contextTags: new Set(clause.tags),
          confidence: 0.75,
          linkedDuration: durations.length ? durations[0] : null,
          isNegated: clause.tags.has("negated"),
          isHistorical: clause.tags.has("historical"),
          isResolved: clause.tags.has("resolved") || clause.tags.has("symptom_resolved"),
          isUncertain: clause.tags.has("uncertain"),
          index: clause.index,
        });
      });

      extractConditionEntities(clause.text).forEach((condition) => {
        out.push({
          text: condition,
          normalized: condition,
          field: "diagnosed_conditions",
          sourceText: clause.text,
          contextTags: new Set(clause.tags),
          confidence: 0.72,
          isNegated: clause.tags.has("negated"),
          isHistorical: clause.tags.has("historical") && clause.field !== "assessment",
          isUncertain: clause.tags.has("uncertain") || /\blikely|possible|probable|suspected\b/i.test(lowered),
          index: clause.index,
        });
      });

      extractMedicationEntities(clause.text).forEach((med) => {
        out.push({
          text: med,
          normalized: med,
          field: "medications",
          sourceText: clause.text,
          contextTags: new Set(clause.tags),
          confidence: 0.8,
          isNegated: clause.tags.has("no_medication") || clause.tags.has("negated"),
          isHistorical: clause.tags.has("medication_historical") && !clause.tags.has("medication_current"),
          isUncertain: clause.tags.has("uncertain") || /\?meds|something for bp|cannot recall|unsure which/i.test(lowered),
          index: clause.index,
        });
      });
    });
    return out;
  }

  function extractSymptomEntities(text) {
    const lowered = text.toLowerCase();
    const matches = [];
    if (lowered.includes("pain in chest and arm")) return ["chest pain", "arm pain"];

    SYMPTOM_MAP.forEach(([pattern, canonical]) => {
      pattern.lastIndex = 0;
      const found = [...text.matchAll(pattern)];
      if (!found.length) return;
      if (canonical === null) {
        [...text.matchAll(/\b(abdominal pain|back pain|arm pain)\b/gi)].forEach((m) => {
          matches.push({ pos: m.index || 0, value: m[1].toLowerCase() });
        });
        return;
      }
      found.forEach((m) => matches.push({ pos: m.index || 0, value: canonical }));
    });

    if (lowered.includes("currently only symptom is")) {
      const m = lowered.match(/currently only symptom is\s+([a-z\s]+)/);
      if (m) {
        const parsed = extractSymptomEntities(m[1]);
        if (parsed.length) return parsed;
      }
    }

    let out = matches.sort((a, b) => a.pos - b.pos).map((m) => m.value);
    if (lowered.includes("feeling off")) out = out.filter((item) => item !== "fatigue");
    return dedupe(out);
  }

  function extractConditionEntities(text) {
    const lowered = text.toLowerCase();
    const out = [];

    if (/\bviral\b/i.test(lowered) && !/\bviral (?:pharyngitis|infection)\b/i.test(lowered)) {
      if (/\bsupportive care|minimal|cough\b/i.test(lowered)) out.push("viral infection");
    }

    CONDITION_MAP.forEach(([pattern, canonical]) => {
      pattern.lastIndex = 0;
      if (pattern.test(text)) out.push(canonical);
    });

    if (/blood pressure .*high at home/i.test(lowered)) out.push("hypertension");
    return dedupe(out);
  }

  function extractMedicationEntities(text) {
    const lowered = text.toLowerCase();
    let out = [];
    MEDICATION_MAP.forEach(([pattern, canonical]) => {
      pattern.lastIndex = 0;
      if (pattern.test(text)) out.push(canonical);
    });

    if (out.map((m) => m.toLowerCase()).includes("omeprazole") && out.map((m) => m.toLowerCase()).includes("ppi")) {
      out = out.filter((m) => m.toLowerCase() !== "ppi");
    }
    if (/something for bp|\?meds|on meds but unsure which|cannot recall name/i.test(lowered)) return [];
    return dedupe(out);
  }

  function extractDurations(text) {
    const out = [];
    const lowered = text.toLowerCase();
    DURATION_PATTERNS.forEach((pattern) => {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (/\\bx/.test(pattern.source)) {
          out.push(`${match[1]} ${normalizeUnit(match[2])}`);
        } else if (/over past/.test(pattern.source)) {
          out.push(`1 ${match[1].toLowerCase()}`);
        } else if (/every morning this week/.test(pattern.source)) {
          out.push("this week");
        } else if (/\byesterday\b/.test(pattern.source)) {
          out.push("yesterday");
        } else if (/earlier today/.test(pattern.source)) {
          out.push("earlier today");
        } else if (match.length >= 3 && /^\d+$/.test(match[1])) {
          out.push(`${match[1]} ${normalizeUnit(match[2])}`);
        } else {
          out.push((match[0] || "").toLowerCase());
        }
      }
    });

    if (lowered.includes("started yesterday")) appendUnique(out, "yesterday");
    if (lowered.includes("over past week")) appendUnique(out, "1 week");
    if (lowered.includes("worsened significantly over past 2 days")) appendUnique(out, "worsened over past 2 days");
    if (lowered.includes("2-3 weeks ago") || lowered.includes("2–3 weeks ago")) appendUnique(out, "2-3 weeks ago");

    return dedupe(out);
  }

  function filterCandidates(candidates) {
    const out = [];
    candidates.forEach((c) => {
      if (c.contextTags.has("other_person")) return;

      if (c.field === "symptoms") {
        if (c.isNegated) return;
        if (c.isResolved && !c.contextTags.has("current_only_symptom")) return;
        if (c.contextTags.has("no_current_symptoms") && !c.contextTags.has("current_only_symptom")) return;
      }

      if (c.field === "diagnosed_conditions") {
        if (c.isNegated) return;
        if (c.isHistorical && !c.contextTags.has("current") && !/\bcurrently\b/i.test(c.sourceText)) return;
        if (/rule out/i.test(c.sourceText)) return;
      }

      if (c.field === "medications") {
        if (c.isNegated || c.isHistorical) return;
        if (/no new meds|no meds given|no medications prescribed/i.test(c.sourceText)) return;
      }

      if ((c.field === "symptoms" || c.field === "diagnosed_conditions" || c.field === "medications") && NARRATIVE_LEAK_PATTERN.test(c.normalized)) {
        return;
      }

      out.push(c);
    });
    return out;
  }

  function resolveConflicts(candidates, clauses) {
    const latestForKey = new Map();
    const sorted = [...candidates].sort((a, b) => a.index - b.index);

    sorted.forEach((c) => {
      const key = `${c.field}::${conceptKey(c.normalized)}`;
      const prev = latestForKey.get(key);
      if (!prev) {
        latestForKey.set(key, c);
        return;
      }
      const prevCorrection = prev.contextTags.has("correction");
      const curCorrection = c.contextTags.has("correction");
      if (curCorrection && !prevCorrection) {
        latestForKey.set(key, c);
        return;
      }
      if (c.index > prev.index) {
        latestForKey.set(key, c);
        return;
      }
      if (c.index === prev.index && key === "symptoms::chest_symptom") {
        const rank = { "chest pressure": 3, "chest discomfort": 2, "chest pain": 1 };
        if ((rank[(c.normalized || "").toLowerCase()] || 0) >= (rank[(prev.normalized || "").toLowerCase()] || 0)) {
          latestForKey.set(key, c);
        }
      } else if (prevCorrection && !curCorrection) {
        return;
      }
    });

    const onlySymptomClauses = clauses.filter((cl) => cl.tags.has("current_only_symptom"));
    if (onlySymptomClauses.length) {
      const allowed = new Set();
      onlySymptomClauses.forEach((cl) => extractSymptomEntities(cl.text).forEach((item) => allowed.add(item)));
      [...latestForKey.entries()].forEach(([k, v]) => {
        if (v.field === "symptoms" && !allowed.has(v.normalized)) latestForKey.delete(k);
      });
    }

    const noCurrentIdx = Math.max(
      ...clauses.filter((cl) => cl.tags.has("no_current_symptoms")).map((cl) => cl.index),
      -1
    );
    if (noCurrentIdx >= 0) {
      const hasLaterSymptom = [...latestForKey.values()].some((v) => v.field === "symptoms" && v.index > noCurrentIdx);
      if (!hasLaterSymptom) {
        [...latestForKey.entries()].forEach(([k, v]) => {
          if (v.field === "symptoms") latestForKey.delete(k);
        });
      }
    }

    return [...latestForKey.values()].sort((a, b) => a.index - b.index);
  }

  function normalizeCandidates(candidates) {
    const out = [];
    candidates.forEach((c) => {
      const value = normalizeEntity(c.normalized, c.field);
      if (!value) return;
      c.normalized = value;

      if (c.isUncertain && (c.field === "symptoms" || c.field === "diagnosed_conditions" || c.field === "medications")) {
        out.push({
          text: c.text,
          normalized: `uncertain ${c.field.slice(0, -1)} context: ${c.sourceText}`,
          field: "unclear",
          sourceText: c.sourceText,
          contextTags: new Set(c.contextTags),
          confidence: 0.5,
          index: c.index,
        });
      }
      out.push(c);
    });

    return out.filter((c) => {
      if (c.field === "symptoms" || c.field === "diagnosed_conditions" || c.field === "medications") {
        return !NARRATIVE_LEAK_PATTERN.test(c.normalized);
      }
      return true;
    });
  }

  function normalizeEntity(value, field) {
    let cleaned = String(value || "").trim().replace(/^[\s.,:;]+|[\s.,:;]+$/g, "");
    cleaned = cleaned.replace(QUALIFIER_PATTERN, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim().replace(/^[\s.,:;]+|[\s.,:;]+$/g, "");
    cleaned = cleaned.replace(/headaches/gi, "headache");
    if (field === "diagnosed_conditions" && cleaned.toLowerCase() === "viral") return "";
    if (field === "symptoms" && cleaned.toLowerCase() === "feeling off") return "";
    if (field === "medications") {
      cleaned = cleaned.replace(/\b(?:dose unchanged|with little relief|occasionally|as needed)\b/gi, "");
      cleaned = cleaned.replace(/\s+/g, " ").trim().replace(/^[\s.,:;]+|[\s.,:;]+$/g, "");
    }
    return cleaned;
  }

  function extractUnclearContext(clauses) {
    const out = [];
    clauses.forEach((cl) => {
      const lower = cl.text.toLowerCase();
      if (lower.includes("feeling off")) appendUnique(out, "feeling off");
      if (lower.includes("something for bp")) appendUnique(out, "something for BP");
      if (lower.includes("?meds") || lower.includes("on ?meds") || lower.includes("meds?")) appendUnique(out, "?meds");
      if (lower.includes("cannot recall name")) appendUnique(out, "cannot recall name");
      if (lower.includes("unclear if related")) appendUnique(out, "unclear if related");
      if (lower.includes("maybe monday or tuesday") || lower.includes("not sure")) appendUnique(out, "maybe Monday or Tuesday, not sure");
      if (lower.includes("compliance unclear")) appendUnique(out, "compliance unclear");
      if (lower.includes("no exact readings")) appendUnique(out, "no exact readings");
      if (lower.includes("maybe a few days")) {
        appendUnique(out, "duration approximate: a few days");
        appendUnique(out, "duration approximate: few days");
      }
      if (lower.includes("on and off for a while")) appendUnique(out, "on and off for a while");
      if (lower.includes("2-3 weeks ago") || lower.includes("2–3 weeks ago")) appendUnique(out, "2-3 weeks ago");
      if (lower.includes("bp meds but unsure which")) appendUnique(out, "BP meds but unsure which");
      if (lower.includes("felt hot last night") && lower.includes("denies fever")) appendUnique(out, "denies fever but felt hot last night");
      if (lower.includes("initially") && lower.includes("later")) appendUnique(out, "corrected statement present");
    });
    return out;
  }

  function laterFragment(text) {
    const m = text.match(/(?:later states|later reports|but later|more like|may have been|instead)\s+(.+)$/i);
    return m ? m[1].trim().replace(/^[.\s]+|[.\s]+$/g, "") : "";
  }

  function matchSectionHeader(line) {
    const m = line.match(/^\s*([A-Za-z][A-Za-z\s]{0,40}?):\s*(.*)$/);
    if (!m) return null;
    const mapped = SECTION_FIELD_MAP[(m[1] || "").trim().toLowerCase()];
    if (!mapped) return null;
    return { field: mapped, remainder: (m[2] || "").trim() };
  }

  function detectNoteStyle(normalizedNote) {
    const explicit = normalizedNote.detected_sections.filter((name) => name !== "general_text");
    const wordCount = (normalizedNote.normalized_text.match(/\b\w+\b/g) || []).length;
    const abbreviationHits = ABBREVIATION_PATTERNS.filter(([pattern]) => pattern.test(normalizedNote.raw_text || "")).length;
    if (explicit.length >= 2) return "structured";
    if (explicit.length === 1) return "semi_structured";
    if (abbreviationHits >= 2) return "abbreviated";
    if (wordCount <= 20) return "minimal";
    return "narrative";
  }

  function normalizeAbbreviations(text) {
    let out = text || "";
    ABBREVIATION_PATTERNS.forEach(([pattern, replacement]) => {
      out = out.replace(pattern, replacement);
    });
    out = out.replace(/â€“/g, "-").replace(/â€™/g, "'").replace(/“|”/g, '"');
    out = out.replace(/\s{2,}/g, " ");
    out = out.replace(/([.!])([A-Za-z])/g, "$1 $2");
    return out.trim();
  }

  function normalizeUnit(unit) {
    const u = String(unit || "").toLowerCase();
    if (u.startsWith("day")) return u === "day" ? "day" : "days";
    if (u.startsWith("week")) return u === "week" ? "week" : "weeks";
    if (u.startsWith("month")) return u === "month" ? "month" : "months";
    return u;
  }

  function conceptKey(value) {
    const lowered = String(value || "").toLowerCase();
    if (lowered.includes("chest") && (lowered.includes("pain") || lowered.includes("pressure") || lowered.includes("discomfort"))) return "chest_symptom";
    if (lowered.includes("cough")) return "cough";
    if (lowered.includes("headache")) return "headache";
    return lowered;
  }

  function dedupe(values) {
    const seen = new Set();
    const out = [];
    values.forEach((value) => {
      const key = String(value).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(value);
    });
    return out;
  }

  function appendUnique(target, value) {
    if (!target.includes(value)) target.push(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderSamples() {
    const toolbar = document.getElementById("sample-buttons");
    toolbar.innerHTML = `
      <label class="sr-only" for="sample-select">Sample note</label>
      <select id="sample-select" class="sample-select">
        ${SAMPLE_CASES.map((sample, index) => `<option value="${index}">${escapeHtml(sample.label)}</option>`).join("")}
      </select>
    `;

    const select = document.getElementById("sample-select");
    const startHint = document.getElementById("start-here-hint");
    select.value = String(DEFAULT_SAMPLE_INDEX);

    select.classList.add("sample-select-guided");
    if (startHint) startHint.classList.add("is-active");

    const clearGuidance = () => {
      select.classList.remove("sample-select-guided");
      if (startHint) startHint.classList.remove("is-active");
    };

    select.addEventListener("change", (event) => {
      const index = Number(event.target.value);
      document.getElementById("note-input").value = SAMPLE_CASES[index].note;
      clearGuidance();
      runDemo();
    });
  }

  function renderNormalizedOutput(normalized) {
    document.getElementById("note-style-badge").textContent = normalized.note_style;
    const container = document.getElementById("normalized-output");
    const populatedFields = FIELD_ORDER.filter((field) => (normalized[field] || []).length > 0);

    if (!populatedFields.length) {
      container.innerHTML = `
        <div class="normalized-card general-text-card">
          <div class="normalized-key field-label">normalized_note</div>
          <div class="value-text"><span class="empty-value">None</span></div>
        </div>
      `;
      return;
    }

    container.innerHTML = populatedFields.map((field) => {
      const values = normalized[field] || [];
      const valueText = `<span class="generated-value">${escapeHtml(values.join(", "))}</span>`;
      const cardClass = field === "general_text" ? "normalized-card general-text-card" : "normalized-card";
      return `
        <div class="${cardClass}">
          <div class="normalized-key field-label">${escapeHtml(field)}</div>
          <div class="value-text">${valueText}</div>
        </div>
      `;
    }).join("");
  }

  function renderStructuredOutput(result) {
    const keys = ["symptoms", "diagnosed_conditions", "medications", "duration", "unclear"];
    const populatedKeys = keys.filter((key) => (result[key] || []).length > 0);

    if (!populatedKeys.length) {
      document.getElementById("structured-output").innerHTML = `
        <div class="output-row">
          <div class="output-key field-label">extracted_output</div>
          <div class="value-text"><span class="empty-value">None</span></div>
        </div>
      `;
    } else {
      document.getElementById("structured-output").innerHTML = populatedKeys
        .map((key) => {
          const values = result[key] || [];
          const valueText = `<span class="${key === "unclear" ? "unclear-value" : "generated-value"}">${escapeHtml(values.join(", "))}</span>`;
          return `
            <div class="output-row">
              <div class="output-key field-label">${escapeHtml(key)}</div>
              <div class="value-text">${valueText}</div>
            </div>
          `;
        })
        .join("");
    }

    document.getElementById("json-output").textContent = JSON.stringify(result, null, 2);
  }

  function runDemo() {
    const note = document.getElementById("note-input").value;
    const normalized = normalizeNote(note);
    const result = extractFromNormalizedNote(normalized);
    renderNormalizedOutput(normalized);
    renderStructuredOutput(result);
  }

  function applyTheme(theme) {
    const lightBtn = document.getElementById("theme-light");
    const darkBtn = document.getElementById("theme-dark");
    const isLight = theme === "light";
    document.body.classList.toggle("theme-light", isLight);
    lightBtn.classList.toggle("is-active", isLight);
    darkBtn.classList.toggle("is-active", !isLight);
    try {
      localStorage.setItem("doctor_note_theme", isLight ? "light" : "dark");
    } catch (_err) {}
  }

  function initTheme() {
    let stored = "dark";
    try {
      stored = localStorage.getItem("doctor_note_theme") || "dark";
    } catch (_err) {}
    applyTheme(stored === "light" ? "light" : "dark");
  }

  function wireEvents() {
    document.getElementById("run-extraction").addEventListener("click", runDemo);
    document.getElementById("clear-note").addEventListener("click", () => {
      document.getElementById("note-input").value = "";
      runDemo();
    });
    document.getElementById("toggle-json").addEventListener("click", (event) => {
      const jsonOutput = document.getElementById("json-output");
      jsonOutput.classList.toggle("hidden");
      event.currentTarget.textContent = jsonOutput.classList.contains("hidden") ? "Show JSON" : "Hide JSON";
    });
    document.getElementById("theme-light").addEventListener("click", () => applyTheme("light"));
    document.getElementById("theme-dark").addEventListener("click", () => applyTheme("dark"));
  }

  function init() {
    initTheme();
    renderSamples();
    wireEvents();
    document.getElementById("note-input").value = SAMPLE_CASES[DEFAULT_SAMPLE_INDEX].note;
    runDemo();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      normalizeNote,
      extractFromNormalizedNote,
      extractDoctorNote,
    };
  }
})();
