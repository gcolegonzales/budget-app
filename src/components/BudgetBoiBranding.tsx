/**
 * BudgetBoi branding: one SVG with hollow silly icon + text. No slogan.
 */
interface BudgetBoiBrandingProps {
  /** "compact" for header bar, "full" for dashboard / hero */
  variant?: "compact" | "full";
  className?: string;
}

const STROKE = "#7c3aed";

export default function BudgetBoiBranding({
  variant = "compact",
  className = "",
}: BudgetBoiBrandingProps) {
  const isFull = variant === "full";
  const height = isFull ? 48 : 32;

  return (
    <svg
      viewBox="0 0 180 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ height: `${height}px`, width: "auto" }}
      aria-label="BudgetBoi"
    >
      {/* Funny money person (hollow) */}
      <g transform="translate(4, 4)" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <circle cx="20" cy="12" r="10" />
        {/* Goofy eyes (one higher) */}
        <circle cx="16" cy="10" r="2.2" />
        <circle cx="24" cy="11" r="2.2" />
        {/* Big smile */}
        <path d="M13 14 Q20 19 27 14" />
        {/* Body / torso */}
        <circle cx="20" cy="26" r="9" />
        {/* Dollar sign on belly */}
        <text x="20" y="30" fontSize="10" fontWeight="700" fill={STROKE} stroke="none" textAnchor="middle" fontFamily="system-ui, sans-serif">$</text>
        {/* Arms holding a coin */}
        <path d="M11 24 L6 22 M29 24 L34 22" />
        <circle cx="6" cy="22" r="3.5" />
        <circle cx="34" cy="22" r="3.5" />
        {/* Little feet */}
        <path d="M14 34 L14 36 M26 34 L26 36" />
      </g>
      {/* Text "BudgetBoi" */}
      <text
        x="52"
        y="32"
        fill="#1e293b"
        fontFamily="'Fredoka', sans-serif"
        fontSize={isFull ? 28 : 22}
        fontWeight="600"
      >
        BudgetBoi
      </text>
    </svg>
  );
}
