interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: string;
}

export function Icon({
  name,
  filled = false,
  className = "",
  size = "text-2xl",
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${size} ${className}`}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1" }
          : undefined
      }
    >
      {name}
    </span>
  );
}
