import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CalcButtonProps {
  children: ReactNode;
  variant: "number" | "function" | "operator";
  isActive?: boolean;
  className?: string;
  onClick: () => void;
}

export const CalcButton = ({
  children,
  variant,
  isActive = false,
  className,
  onClick,
}: CalcButtonProps) => {
  const baseStyles =
    "flex items-center justify-center text-xl font-bold transition-all duration-150 active:scale-95 select-none cursor-pointer rounded-xl border-2 shadow-md";

  const variantStyles = {
    number: "bg-calc-number hover:bg-calc-number-hover text-calc-text border-calc-body-border h-14",
    function: "bg-calc-function hover:bg-calc-function-hover text-calc-text border-calc-body-border h-14",
    operator: cn(
      "h-14 border-calc-body-border",
      isActive
        ? "bg-calc-operator-active text-calc-text"
        : "bg-calc-operator hover:bg-calc-operator-hover text-calc-text"
    ),
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
