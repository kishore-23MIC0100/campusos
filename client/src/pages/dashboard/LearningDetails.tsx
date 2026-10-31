import { FlaskConical, BookOpen } from "lucide-react";

export function DemoProfileNote({ name }: { name: string }) {
  return (
    <aside className="workspace-demo-note">
      <FlaskConical size={20} />
      <div>
        <strong>Demo profile: {name}</strong>
        <span>
          Fictional records for exploring the portal. Changes here stay in the
          local review database.
        </span>
      </div>
    </aside>
  );
}

export function SubjectResults({
  records,
}: {
  records: Record<string, any>[];
}) {
  return (
    <div className="overview-scorecard">
      {records.slice(0, 6).map((item) => (
        <div key={item.id}>
          <span className="overview-link-icon">
            <BookOpen size={17} />
          </span>
          <div>
            <strong>{item.subject}</strong>
            <p>
              {String(item.exam_type || item.term || "Assessment")
                .replaceAll("_", " ")
                .toLowerCase()}
            </p>
          </div>
          <span className="overview-score">
            {item.marks_obtained}
            <small> / {item.max_marks}</small>
          </span>
          {item.grade_letter && (
            <span className="overview-tag">{item.grade_letter}</span>
          )}
        </div>
      ))}
    </div>
  );
}
