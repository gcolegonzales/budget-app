import type { ReactNode } from "react";

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export interface ArrowNavigationProps {
  /** Center content (e.g. "February 2026"). Uses same class as react-calendar nav label. */
  children: ReactNode;
  onPrev: () => void;
  onNext: () => void;
  /** When set, the center is rendered as a button and this runs on click. */
  onCenterClick?: () => void;
  /** Previous button content (default: chevron left icon). */
  prevLabel?: ReactNode;
  /** Next button content (default: chevron right icon). */
  nextLabel?: ReactNode;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  prevAriaLabel?: string;
  nextAriaLabel?: string;
  centerAriaLabel?: string;
}

/**
 * Nav bar with prev/next arrows and a center label. Uses the same class names
 * as react-calendar's navigation so existing styles apply unchanged.
 */
export default function ArrowNavigation({
  children,
  onPrev,
  onNext,
  onCenterClick,
  prevLabel,
  nextLabel,
  prevDisabled = false,
  nextDisabled = false,
  prevAriaLabel = "Previous",
  nextAriaLabel = "Next",
  centerAriaLabel,
}: ArrowNavigationProps) {
  const prevContent = prevLabel ?? <ChevronLeft />;
  const nextContent = nextLabel ?? <ChevronRight />;
  const centerContent = (
    <span className="react-calendar__navigation__label__labelText">
      {children}
    </span>
  );
  const centerEl = onCenterClick ? (
    <button
      type="button"
      onClick={onCenterClick}
      className="react-calendar__navigation__label"
      aria-label={centerAriaLabel}
    >
      {centerContent}
    </button>
  ) : (
    <span className="react-calendar__navigation__label" aria-hidden>
      {centerContent}
    </span>
  );

  return (
    <div className="react-calendar__navigation" role="navigation">
      <button
        type="button"
        onClick={onPrev}
        disabled={prevDisabled}
        className="react-calendar__navigation__prev-button"
        aria-label={prevAriaLabel}
      >
        {prevContent}
      </button>
      {centerEl}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="react-calendar__navigation__next-button"
        aria-label={nextAriaLabel}
      >
        {nextContent}
      </button>
    </div>
  );
}
