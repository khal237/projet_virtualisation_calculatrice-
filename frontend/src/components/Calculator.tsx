import { useState } from "react";
import { CalcButton } from "./CalcButton";
import { CalcDisplay } from "./CalcDisplay";

type Operator = "+" | "-" | "×" | "÷" | null;

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      setActiveOperator(null);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      setActiveOperator(null);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setActiveOperator(null);
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const performOperation = (nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
    setActiveOperator(nextOperator);
  };

  const calculate = (left: number, right: number, op: Operator): number => {
    switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "×":
        return left * right;
      case "÷":
        return right !== 0 ? left / right : 0;
      default:
        return right;
    }
  };

  const equals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setActiveOperator(null);
    }
  };

  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (value.includes(".") && value.endsWith(".")) {
      return value;
    }
    
    if (Math.abs(num) >= 1e9) {
      return num.toExponential(4);
    }
    
    return num.toLocaleString("fr-FR", { maximumFractionDigits: 8 });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-3xl border-4 border-calc-body-border bg-calc-body p-6 shadow-[var(--calc-shadow)]">
        {/* Calculator Screen */}
        <CalcDisplay value={formatDisplay(display)} />
        
        {/* Calculator Buttons */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <CalcButton variant="function" onClick={clear}>
            {display === "0" ? "AC" : "C"}
          </CalcButton>
          <CalcButton variant="function" onClick={toggleSign}>
            ±
          </CalcButton>
          <CalcButton variant="function" onClick={percentage}>
            %
          </CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "÷"}
            onClick={() => performOperation("÷")}
          >
            ÷
          </CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("7")}>
            7
          </CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("8")}>
            8
          </CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("9")}>
            9
          </CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "×"}
            onClick={() => performOperation("×")}
          >
            ×
          </CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("4")}>
            4
          </CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("5")}>
            5
          </CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("6")}>
            6
          </CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "-"}
            onClick={() => performOperation("-")}
          >
            −
          </CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("1")}>
            1
          </CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("2")}>
            2
          </CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("3")}>
            3
          </CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "+"}
            onClick={() => performOperation("+")}
          >
            +
          </CalcButton>

          <CalcButton variant="number" className="col-span-2" onClick={() => inputDigit("0")}>
            0
          </CalcButton>
          <CalcButton variant="number" onClick={inputDecimal}>
            ,
          </CalcButton>
          <CalcButton variant="operator" onClick={equals}>
            =
          </CalcButton>
        </div>
      </div>
    </div>
  );
};
