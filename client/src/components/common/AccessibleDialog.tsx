import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  busy?: boolean;
};
const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared operational dialog: named semantics, focus containment, Escape and
 * backdrop dismissal, scroll lock and focus return to the opening control. */
export function AccessibleDialog({
  title,
  onClose,
  children,
  className = "",
  busy = false,
}: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const current = useRef({ onClose, busy });
  useLayoutEffect(() => {
    current.current = { onClose, busy };
  }, [onClose, busy]);

  useEffect(() => {
    const dialog = surface.current;
    if (!dialog) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.getClientRects().length > 0);
    const initial = dialog.querySelector<HTMLElement>(
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
    );
    (initial || controls()[0] || dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!current.current.busy) current.current.onClose();
      }
      if (event.key === "Tab") {
        const items = controls();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target))
        (controls()[0] || dialog).focus();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", containFocus);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div
      className="workspace-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={surface}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={busy}
        tabIndex={-1}
        className={`workspace-dialog ${className} my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto outline-none`}
      >
        {children}
      </div>
    </div>
  );
}
