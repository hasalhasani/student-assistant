/* ===================================================================
   MOCKS — canned responses used when USE_MOCKS is true.

   These mirror the shapes the real backends are expected to return,
   so switching USE_MOCKS off should be the only change needed once
   the n8n workflows and planner API are live.
=================================================================== */

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

export const mockSubjects = [
  { id: "sci", name: { ar: "العلوم", en: "Science" }, icon: "ti-atom" },
  { id: "math", name: { ar: "الرياضيات", en: "Math" }, icon: "ti-math" },
  {
    id: "ar",
    name: { ar: "اللغة العربية", en: "Arabic" },
    icon: "ti-language",
    soon: true,
  },
  {
    id: "en",
    name: { ar: "اللغة الإنجليزية", en: "English" },
    icon: "ti-abc",
    soon: true,
  },
];

export const mockLessons = {
  sci: [
    { id: "sci-1", name: { ar: "الخلية", en: "The Cell" } },
    { id: "sci-2", name: { ar: "الجهاز الهضمي", en: "Digestive System" } },
    { id: "sci-3", name: { ar: "الطاقة", en: "Energy" } },
  ],
  math: [
    { id: "math-1", name: { ar: "الكسور", en: "Fractions" } },
    { id: "math-2", name: { ar: "الأعداد العشرية", en: "Decimals" } },
  ],
};

export async function mockMCQ() {
  await delay();
  return {
    questions: [
      {
        question: {
          ar: "ما هي وحدة بناء الكائن الحي؟",
          en: "What is the basic unit of a living organism?",
        },
        options: {
          ar: ["الخلية", "النواة", "العضية", "النسيج"],
          en: ["The cell", "The nucleus", "The organelle", "The tissue"],
        },
        correct: 0,
        explanation: {
          ar: "الخلية هي أصغر وحدة بناء ووظيفة في الكائن الحي.",
          en: "The cell is the smallest structural and functional unit.",
        },
      },
      {
        question: {
          ar: "أي جزء من الخلية يتحكم في أنشطتها؟",
          en: "Which part of the cell controls its activities?",
        },
        options: {
          ar: ["الغشاء", "النواة", "السيتوبلازم", "الجدار"],
          en: ["Membrane", "Nucleus", "Cytoplasm", "Cell wall"],
        },
        correct: 1,
        explanation: {
          ar: "النواة تحتوي على المادة الوراثية وتتحكم في أنشطة الخلية.",
          en: "The nucleus holds genetic material and directs cell activity.",
        },
      },
      {
        question: {
          ar: "ما الذي ينتج الطاقة في الخلية؟",
          en: "What produces energy in the cell?",
        },
        options: {
          ar: ["الميتوكوندريا", "الرايبوسوم", "النواة", "الفجوة"],
          en: ["Mitochondria", "Ribosome", "Nucleus", "Vacuole"],
        },
        correct: 0,
        explanation: {
          ar: "الميتوكوندريا هي مصنع الطاقة في الخلية.",
          en: "Mitochondria are the powerhouse of the cell.",
        },
      },
    ],
  };
}

export async function mockFlashcards() {
  await delay();
  return {
    questions: [
      {
        front: { ar: "الخلية", en: "Cell" },
        back: {
          ar: "أصغر وحدة بناء ووظيفة في الكائن الحي.",
          en: "The smallest structural and functional unit of a living thing.",
        },
      },
      {
        front: { ar: "النواة", en: "Nucleus" },
        back: {
          ar: "تحتوي على المادة الوراثية وتتحكم في أنشطة الخلية.",
          en: "Holds genetic material and controls the cell's activities.",
        },
      },
      {
        front: { ar: "الميتوكوندريا", en: "Mitochondria" },
        back: {
          ar: "مصنع الطاقة في الخلية.",
          en: "The powerhouse of the cell.",
        },
      },
    ],
  };
}

export async function mockChat(input, lang) {
  await delay(900);
  const replies = {
    ar: [
      "سؤال ممتاز! الخلية هي وحدة البناء الأساسية في جميع الكائنات الحية. هل تريد أن نتعمق أكثر؟",
      "بالضبط 👍 هل لديك سؤال آخر عن هذا الدرس؟",
      "دعني أشرح ذلك ببساطة: كل كائن حي يتكوّن من خلية واحدة أو أكثر.",
    ],
    en: [
      "Great question! The cell is the basic building block of every living organism. Want to go deeper?",
      "Exactly 👍 Any other questions about this lesson?",
      "Let me put it simply: every living thing is made of one or more cells.",
    ],
  };
  const pool = replies[lang] || replies.en;
  return { output: pool[Math.floor(Math.random() * pool.length)] };
}

export async function mockSessionSummary(lang) {
  await delay();
  return {
    summary_text:
      lang === "ar"
        ? "جلسة رائعة! راجعت 3 مفاهيم أساسية. ننصح بمراجعة الميتوكوندريا مرة أخرى."
        : "Great session! You covered 3 key concepts. Consider revisiting mitochondria.",
  };
}

/**
 * What the history webhook is expected to return: everything the user
 * did before, so the app can restore their state on sign-in.
 */
export async function mockUserHistory() {
  await delay(900); // deliberately slower than login, to show it not blocking

  const today = new Date();
  const day = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  return {
    sessions: [
      {
        id: "h-1",
        date: day(-3),
        lesson: { ar: "الخلية", en: "The Cell" },
        mode: "mcq",
        score: 4,
        total: 5,
      },
      {
        id: "h-2",
        date: day(-2),
        lesson: { ar: "الجهاز الهضمي", en: "Digestive System" },
        mode: "flashcards",
        score: null,
        total: 8,
      },
      {
        id: "h-3",
        date: day(-1),
        lesson: { ar: "الطاقة", en: "Energy" },
        mode: "chat",
        score: null,
        total: null,
      },
    ],
    plan: {
      plan_id: "plan-restored",
      name: "My Study Plan",
      sessions: [
        {
          id: "p-1",
          day: 1,
          date: day(0),
          course: "Science",
          duration: 90,
          done: true,
        },
        {
          id: "p-2",
          day: 1,
          date: day(0),
          course: "Math",
          duration: 60,
          done: false,
        },
        {
          id: "p-3",
          day: 2,
          date: day(1),
          course: "Science",
          duration: 90,
          done: false,
        },
      ],
      tips: [
        "Take a 10-minute break every 50 minutes.",
        "Review yesterday's material before starting something new.",
      ],
    },
    stats: {
      streak_days: 3,
      sessions_total: 12,
      questions_answered: 47,
    },
  };
}

export async function mockPlan(courses, hoursPerDay, days) {
  await delay(1200);
  const list = courses.filter((c) => c.name.trim());
  const sessions = [];
  const today = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const perDay = Math.max(1, Math.round(hoursPerDay / 1.5));
    for (let s = 0; s < perDay; s++) {
      const course = list[(d + s) % Math.max(1, list.length)];
      if (!course) continue;
      sessions.push({
        id: `s-${d}-${s}`,
        day: d + 1,
        date: date.toISOString().slice(0, 10),
        course: course.name,
        topic: `${course.name} — session ${s + 1}`,
        duration: 90,
        done: false,
      });
    }
  }

  return {
    plan_id: "mock-plan-1",
    name: "My Study Plan",
    sessions,
    tips: [
      "Take a 10-minute break every 50 minutes.",
      "Review yesterday's material before starting something new.",
      "Study your hardest subject when your energy is highest.",
    ],
  };
}
