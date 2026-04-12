import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-action text-white hover:bg-red-800 transition-all duration-300 font-headline font-black tracking-widest uppercase",
  secondary:
    "bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-colors font-headline font-bold tracking-widest uppercase border-b-2 border-outline-variant",
  tertiary:
    "bg-transparent text-primary font-headline font-bold tracking-widest uppercase hover:text-white transition-colors",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", icon, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-10 py-5 text-lg flex items-center justify-center gap-3 active:scale-95 duration-150 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
        {icon}
      </button>
    );
  }
);

Button.displayName = "Button";
