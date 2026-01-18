interface CalcDisplayProps {
  value: string;
}

export const CalcDisplay = ({ value }: CalcDisplayProps) => {
  const getFontSize = () => {
    if (value.length > 12) return "text-2xl";
    if (value.length > 9) return "text-3xl";
    if (value.length > 6) return "text-4xl";
    return "text-5xl";
  };

  return (
    <div className="rounded-xl border-2 border-calc-body-border bg-calc-screen p-4 shadow-inner">
      <div className="flex h-20 items-end justify-end overflow-hidden">
        <span
          className={`font-mono font-bold text-calc-screen-text transition-all duration-200 ${getFontSize()}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
};
