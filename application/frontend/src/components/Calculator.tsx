import { useState } from "react";
import { CalcButton } from "./CalcButton";
import { CalcDisplay } from "./CalcDisplay";

type Operator = "+" | "-" | "×" | "÷" | null;


const API_URL = "http://localhost:5000/api";

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);
  
  
  const [isLoading, setIsLoading] = useState(false);

  const inputDigit = (digit: string) => {
    if (isLoading) return; 

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      setActiveOperator(null);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (isLoading) return;

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
    setIsLoading(false);
  };

  const toggleSign = () => {
    if (isLoading) return;
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const percentage = () => {
    if (isLoading) return;
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  
  const mapOperatorToBackend = (op: Operator): string => {
    switch (op) {
      case "×": return "*";
      case "÷": return "/";
      default: return op || "+";
    }
  };

  
  const calculateCloud = async (left: number, right: number, op: Operator): Promise<number | string> => {
    try {
      setIsLoading(true);
      setDisplay("..."); 
      const postResponse = await fetch(`${API_URL}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a: left,
          b: right,
          op: mapOperatorToBackend(op),
        }),
      });

      if (!postResponse.ok) throw new Error("Erreur API");
      
      const { task_id } = await postResponse.json();

      let result = null;
      let attempts = 0;
      
      while (result === null && attempts < 50) { 
        await new Promise((resolve) => setTimeout(resolve, 200));

        const getResponse = await fetch(`${API_URL}/result/${task_id}`);
        
     
        if (getResponse.status === 404) {
            attempts++;
            continue; 
        }

        const data = await getResponse.json();
        if (data.status === "completed") {
          result = data.result;
        }
      }

      if (result === null) throw new Error("Timeout");
      
      setIsLoading(false);
      return result;

    } catch (error) {
      console.error("Erreur de calcul:", error);
      setIsLoading(false);
      return "Err";
    }
  };

 

  const performOperation = async (nextOperator: Operator) => {
    if (isLoading) return;

    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {

      const result = await calculateCloud(previousValue, inputValue, operator);
      
      if (result === "Err") {
          setDisplay("Err");
          setPreviousValue(null);
      } else {
          setDisplay(String(result));
          setPreviousValue(result as number);
      }
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
    setActiveOperator(nextOperator);
  };

  const equals = async () => {
    if (isLoading) return;

    const inputValue = parseFloat(display);

    if (previousValue !== null && operator) {
  
      const result = await calculateCloud(previousValue, inputValue, operator);

      if (result === "Err") {
        setDisplay("Err");
      } else {
        setDisplay(String(result));
      }
      
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setActiveOperator(null);
    }
  };

  const formatDisplay = (value: string): string => {
    if (value === "..." || value === "Err") return value;

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
        <CalcDisplay value={formatDisplay(display)} />
        
        <div className="grid grid-cols-4 gap-3 mt-4">
          <CalcButton variant="function" onClick={clear}>
            {display === "0" ? "AC" : "C"}
          </CalcButton>
          <CalcButton variant="function" onClick={toggleSign}>±</CalcButton>
          <CalcButton variant="function" onClick={percentage}>%</CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "÷"}
            onClick={() => performOperation("÷")}
          >÷</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("7")}>7</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("8")}>8</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("9")}>9</CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "×"}
            onClick={() => performOperation("×")}
          >
            ×
          </CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("4")}>4</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("5")}>5</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("6")}>6</CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "-"}
            onClick={() => performOperation("-")}
          >
            −
          </CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("1")}>1</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("2")}>2</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("3")}>3</CalcButton>
          <CalcButton
            variant="operator"
            isActive={activeOperator === "+"}
            onClick={() => performOperation("+")}
          >
            +
          </CalcButton>

          <CalcButton variant="number" className="col-span-2" onClick={() => inputDigit("0")}>0</CalcButton>
          <CalcButton variant="number" onClick={inputDecimal}>,</CalcButton>
          <CalcButton variant="operator" onClick={equals}>=</CalcButton>
        </div>
      </div>
    </div>
  );
};