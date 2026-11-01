import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
}: {
  title: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <header className="workspace-page-header">
      <div>
        <div className="workspace-page-eyebrow">
          <Icon size={16} />
          <span>{eyebrow}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="workspace-page-actions">{actions}</div>}
    </header>
  );
}
