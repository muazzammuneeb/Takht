/** Takht crown mark: a simple stroked crown with three peaks. */
export function Crown({ size = 28, strokeWidth = 2, className, color }: { size?: number; strokeWidth?: number; className?: string; color?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.75}
      viewBox="0 0 32 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 19 L2.5 6 L10 12 L16 3 L22 12 L29.5 6 L28 19 Z" />
      <path d="M4 22 H28" />
      <circle cx="16" cy="3" r="0.6" fill={color ?? "currentColor"} />
    </svg>
  );
}
