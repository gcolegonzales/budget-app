import type { ReactNode } from "react";

export interface ModularCalendarCardProps {
  /** Optional header (e.g. ArrowNavigation). When set, body’s inner nav is hidden. */
  header?: ReactNode;
  /** Main content (e.g. calendar grid). */
  body: ReactNode;
  /** Class name for the outer container (e.g. calendar-card, rounded, shadow). */
  className?: string;
}

/**
 * Card with pluggable header and body. Container and layout stay the same;
 * you control what goes in the header and body and how clicks behave.
 */
export default function ModularCalendarCard({
  header,
  body,
  className = "",
}: ModularCalendarCardProps) {
  const hasCustomHeader = header != null;
  return (
    <div
      className={`modular-calendar-card ${hasCustomHeader ? "modular-calendar-card--custom-header" : ""} ${className}`.trim()}
    >
      {header != null && (
        <div className="modular-calendar-card__header">{header}</div>
      )}
      <div className="modular-calendar-card__body">{body}</div>
    </div>
  );
}
