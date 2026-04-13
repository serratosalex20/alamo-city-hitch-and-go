interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: string;
  /** Set to a string to make icon meaningful for screen readers; otherwise hidden */
  ariaLabel?: string;
}

export function Icon({
  name,
  filled = false,
  className = "",
  size = "text-2xl",
  ariaLabel,
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${size} ${className}`}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1" }
          : undefined
      }
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {name}
    </span>
  );
}
