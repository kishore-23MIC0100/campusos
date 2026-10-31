import type { DatabaseState, PureDatabase } from "./db.js";
import type { SharedPortalConfig } from "./shared-portal-accounts.js";

/** Fictional review records belong only to the local JSON demo database. */
export function seedSharedPortalDemo(
  db: PureDatabase,
  config: SharedPortalConfig | null,
) {
  if (
    !config ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL ||
    process.env.DATABASE_URL
  )
    return { enabled: false, students: 0 };
  const users = db.prepare("SELECT * FROM users").all();
  const studentUser = users.find(
    (user) =>
      user.email?.toLowerCase() === config.email.toLowerCase() &&
      user.role === "STUDENT",
  );
  const parentUser = users.find(
    (user) =>
      user.email?.toLowerCase() === config.email.toLowerCase() &&
      user.role === "PARENT",
  );
  if (!studentUser || !parentUser) return { enabled: false, students: 0 };
  const date = (offset: number) => {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  };
  function insert(table: keyof DatabaseState, row: Record<string, unknown>) {
    if (db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(row.id)) return;
    const keys = Object.keys(row);
    db.prepare(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
    ).run(...Object.values(row));
  }
  const base = `demo_review_${studentUser.id}`;
  const parent = db
    .prepare("SELECT * FROM parents WHERE user_id = ? OR email = ?")
    .get(parentUser.id, parentUser.email);
  const existing = db
    .prepare("SELECT * FROM students WHERE user_id = ? OR student_id = ?")
    .get(studentUser.id, studentUser.student_id || "");
  // Respect any academic records the operator has already connected.
  if ((existing && !existing.is_demo) || (parent && !parent.is_demo))
    return { enabled: true, students: 0 };
  const children = [
    {
      id: `${base}_aarav`,
      first_name: "Aarav",
      last_name: "Iyer",
      grade: "Grade 10",
      section: "D",
      roll_no: 12,
      user_id: studentUser.id,
      scores: [87, 81, 93, 85],
    },
    {
      id: `${base}_mira`,
      first_name: "Mira",
      last_name: "Iyer",
      grade: "Grade 7",
      section: "D",
      roll_no: 8,
      user_id: null,
      scores: [89, 84, 91, 86],
    },
  ];
  for (const child of children) {
    const classId = `demo_review_${child.grade.replaceAll(" ", "_")}_d`;
    const studentId = `DEMO-${child.grade === "Grade 10" ? "10" : "07"}-${studentUser.id.slice(-6)}`;
    insert("classes", {
      id: classId,
      grade: child.grade,
      section: child.section,
      class_teacher_id: "tch_1",
      class_teacher_name: "Priya Nair",
      room_number:
        child.grade === "Grade 10"
          ? "Learning Studio 204"
          : "Learning Studio 107",
      total_students: 1,
      academic_year: "2026-2027",
      is_demo: true,
    });
    insert("students", {
      id: child.id,
      user_id: child.user_id,
      student_id: studentId,
      admission_no: studentId,
      first_name: child.first_name,
      last_name: child.last_name,
      grade: child.grade,
      section: child.section,
      roll_no: child.roll_no,
      academic_year: "2026-2027",
      house: "Orion",
      parent_id: parentUser.id,
      parent_name: config.fullName,
      status: "ACTIVE",
      is_demo: true,
    });
    if (child.user_id && !studentUser.student_id)
      db.prepare(
        "UPDATE users SET student_id = ?, admission_no = ?, grade_section = ? WHERE id = ?",
      ).run(
        studentId,
        studentId,
        `${child.grade} ${child.section}`,
        child.user_id,
      );
    let offset = -1;
    for (let index = 0; index < 20; ) {
      const day = date(offset--);
      if ([0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay())) continue;
      insert("attendance_records", {
        id: `${child.id}_attendance_${index}`,
        date: day,
        class_id: classId,
        grade: child.grade,
        section: child.section,
        student_id: child.id,
        student_name: `${child.first_name} ${child.last_name}`,
        roll_no: child.roll_no,
        status: index === 6 ? "ABSENT" : index === 12 ? "LATE" : "PRESENT",
        marked_by: "Priya Nair",
        remarks: "Fictional demonstration record",
        is_demo: true,
      });
      index++;
    }
    const subjects = ["Mathematics", "Science", "Computer Science", "English"];
    subjects.forEach((subject, index) => {
      insert("performance_records", {
        id: `${child.id}_score_${index}`,
        student_id: child.id,
        student_name: `${child.first_name} ${child.last_name}`,
        grade: child.grade,
        section: child.section,
        subject,
        term: "TERM_1",
        exam_type: "UNIT_TEST",
        max_marks: 100,
        marks_obtained: child.scores[index],
        grade_letter: child.scores[index] >= 90 ? "A+" : "A",
        teacher_remarks: [
          "Clear reasoning; keep checking the final calculation.",
          "Good application of concepts in practical work.",
          "Confident problem solving and well-organized code.",
          "Thoughtful reading; develop examples in longer answers.",
        ][index],
        academic_year: "2026-2027",
        is_demo: true,
      });
      insert("homework", {
        id: `${child.id}_homework_${index}`,
        title: [
          "Patterns, equations & everyday problems",
          "Build a simple water filtration model",
          "Create a personal reading tracker",
          "A character study in 500 words",
        ][index],
        subject,
        grade: child.grade,
        section: child.section,
        teacher_id: "usr_teacher_1",
        teacher_name: "Priya Nair",
        description:
          "Demo assignment: explain your approach, show your work and include a short reflection on what you learned.",
        due_date: date(index + 2),
        priority: index === 0 ? "IMPORTANT" : "NORMAL",
        attachments: "[]",
        status: "ACTIVE",
        is_demo: true,
      });
    });
    for (const day of [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ]) {
      subjects.forEach((subject, index) =>
        insert("timetables", {
          id: `${child.id}_${day}_${index}`,
          grade: child.grade,
          section: child.section,
          day_of_week: day,
          period_index: index + 1,
          start_time: ["08:30", "09:25", "10:40", "11:35"][index],
          end_time: ["09:15", "10:10", "11:25", "12:20"][index],
          subject,
          teacher_id: "usr_teacher_1",
          teacher_name: "Priya Nair",
          room_number: index === 2 ? "Computing Lab" : "Learning Studio 204",
          is_demo: true,
        }),
      );
    }
    const assessmentId = `${child.id}_assessment`;
    insert("assessments", {
      id: assessmentId,
      title: "Learning check: patterns & reasoning",
      assessment_type: "Practice Quiz",
      grade: child.grade,
      section: child.section,
      subject: "Mathematics",
      max_marks: 10,
      weightage: 0,
      assessment_date: date(3),
      term: "Term 1",
      description:
        "A short demonstration quiz. Choose the best answer for each question.",
      faculty_id: "usr_teacher_1",
      faculty_name: "Priya Nair",
      status: "PUBLISHED",
      questions: JSON.stringify([
        {
          id: "pattern",
          type: "MULTIPLE_CHOICE",
          prompt: "What is the next number in 3, 6, 12, 24, ...?",
          marks: 5,
          options: ["30", "36", "48", "54"],
          correctAnswer: "48",
        },
        {
          id: "area",
          type: "MULTIPLE_CHOICE",
          prompt: "A rectangle is 8 cm long and 5 cm wide. What is its area?",
          marks: 5,
          options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"],
          correctAnswer: "40 cm²",
        },
      ]),
      settings: JSON.stringify({
        timeLimitMinutes: 30,
        shuffleQuestions: false,
      }),
      attachments: "[]",
      is_demo: true,
    });
    insert("assessment_marks", {
      id: `${assessmentId}_mark`,
      assessment_id: assessmentId,
      student_id: child.id,
      student_name: `${child.first_name} ${child.last_name}`,
      marks_obtained: null,
      max_marks: 10,
      status: "PENDING",
      is_demo: true,
    });
    const projects = [
      {
        key: "science",
        title: "Science journal: observation & evidence",
        subject: "Science",
        type: "Written task",
        max: 20,
        description:
          "Describe a water filtration experiment. Explain your prediction, what you observed and one way to improve your method.",
        questions: [
          {
            id: "reflection",
            prompt:
              "How would you test whether a simple water filter is effective? Describe your method and the evidence you would collect.",
            type: "SHORT_ANSWER",
            marks: 20,
          },
        ],
        days: 5,
      },
      {
        key: "code",
        title: "Code lab: your reading counter",
        subject: "Computer Science",
        type: "Coding challenge",
        max: 20,
        description:
          "Write a short Python program that adds the pages read over seven days and reports the daily average. Your teacher will review the submitted code.",
        questions: [
          {
            id: "reading",
            prompt:
              "Write a Python function that accepts a list of daily page counts and returns the total and average. Handle an empty list.",
            type: "CODE",
            language: "python",
            marks: 20,
          },
        ],
        days: 7,
      },
      {
        key: "portfolio",
        title: "A story worth sharing",
        subject: "English",
        type: "Creative project",
        max: 25,
        description:
          "Create a short illustrated reading journal about a character whose choices changed the story. Upload your document for teacher feedback.",
        questions: [],
        days: 9,
      },
    ];
    for (const project of projects) {
      const id = `${child.id}_assessment_${project.key}`;
      insert("assessments", {
        id,
        title: project.title,
        subject: project.subject,
        assessment_type: project.type,
        grade: child.grade,
        section: child.section,
        max_marks: project.max,
        weightage: 0,
        assessment_date: date(project.days),
        due_at: `${date(project.days)}T12:30:00.000Z`,
        term: "Term 1",
        description: project.description,
        faculty_id: "usr_teacher_1",
        faculty_name: "Priya Nair",
        status: "PUBLISHED",
        questions: JSON.stringify(project.questions),
        settings: JSON.stringify({
          timeLimitMinutes: 30,
          attemptsAllowed: 1,
          shuffleQuestions: false,
        }),
        attachments: "[]",
        is_demo: true,
      });
      insert("assessment_marks", {
        id: `${id}_mark`,
        assessment_id: id,
        student_id: child.id,
        student_name: `${child.first_name} ${child.last_name}`,
        marks_obtained: null,
        max_marks: project.max,
        status: "PENDING",
        is_demo: true,
      });
    }
  }
  const names = config.fullName.split(" ");
  insert("parents", {
    id: `${base}_parent`,
    user_id: parentUser.id,
    first_name: names[0],
    last_name: names.slice(1).join(" "),
    relation: "Guardian",
    email: config.email,
    children_ids: JSON.stringify(children.map((child) => child.id)),
    is_demo: true,
  });
  for (const user of [studentUser, parentUser])
    insert("notifications", {
      id: `${base}_notice_${user.role}`,
      user_id: user.id,
      target_role: user.role,
      title: "Your demo workspace is ready",
      message:
        "Explore fictional attendance, coursework and learning progress. These records are for local review.",
      type: "GENERAL",
      is_read: 0,
      link_url: "/dashboard",
      is_demo: true,
    });
  db.scheduleSave();
  return { enabled: true, students: children.length };
}
