import { useState, KeyboardEvent } from "react";
import { CalcButton } from "./CalcButton";

type Operator = "+" | "-" | "×" | "÷" | null;
const API_URL = "/api";

export const Calculator = () => {
  // --- ÉTATS ---
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);
  
  // ÉTATS PARTIE RÉCUPÉRATION
  const [taskIdInput, setTaskIdInput] = useState("");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- LOGIQUE CALCULATRICE ---
  const mapOperator = (op: Operator): string => {
    switch (op) {
      case "×": return "*";
      case "÷": return "/";
      default: return op || "+";
    }
  };

  const submitCalculation = async (a: number, b: number, op: Operator) => {
    if (loading) return; 

    try {
      setLoading(true);
      setDisplay("Envoi...");
      
      const response = await fetch(`${API_URL}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a, b, op: mapOperator(op) }),
      });

      if (!response.ok) throw new Error("Erreur API");
      
      const data = await response.json();
      
      setDisplay(data.task_id);
      setTaskIdInput(data.task_id); 
      // On efface le message du bas pour inviter à cliquer
      setResultMessage(null); 
      
      setLoading(false);
    } catch (error) {
      console.error(error);
      setDisplay("Erreur");
      setLoading(false);
    }
  };

  const performOperation = (nextOperator: Operator) => {
    const inputValue = parseFloat(display);
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } 
    setWaitingForOperand(true);
    setOperator(nextOperator);
    setActiveOperator(nextOperator);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (previousValue !== null && operator) {
      submitCalculation(previousValue, inputValue, operator);
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setActiveOperator(null);
    }
  };

  const inputDigit = (digit: string) => {
    if (loading) return; 
    if (isNaN(Number(display)) && display !== ".") {
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
    }
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
        return;
    }
    if (!display.includes(".")) {
        setDisplay(display + "."); 
    }
  };

  // --- LOGIQUE RÉCUPÉRATION  ---
  const fetchManualResult = async () => {
    if (!taskIdInput || loading) return;
    
    
    if (resultMessage && resultMessage.includes("")) return;

    try {
      setLoading(true);
    
      
      const response = await fetch(`${API_URL}/result/${taskIdInput}`);
      
      if (response.status === 404) {
        setResultMessage("⏳ Pas encore prêt... (Réessaie)");
      } else if (response.ok) {
        const data = await response.json();
        if (data.status === "completed") {
          setResultMessage(` RÉSULTAT : ${data.result}`);
        } else {
           setResultMessage(` Statut : ${data.status}`);
        }
      } else {
        setResultMessage(" ID Inconnu");
      }
    } catch (error) {
      console.error(error);
      setResultMessage(" Erreur connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    //  Si l'utilisateur reste appuyé sur Entrée, on ignore les répétitions
    if (e.repeat) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      fetchManualResult();
    }
  };

  // UI HELPERS
  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setActiveOperator(null);
    setResultMessage(null);
    setTaskIdInput("");
    setLoading(false);
  };

  const getDisplayClass = () => {
    if (display.length > 15) return "text-xs";
    if (display.length > 10) return "text-lg";
    return "text-4xl";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-8">
      
      {/* 1. CALCULATRICE */}
      <div className="w-full max-w-sm rounded-3xl border-4 border-calc-body-border bg-calc-body p-6 shadow-[var(--calc-shadow)]">
        <div className={`mb-4 flex h-20 items-center justify-end rounded-xl bg-calc-screen px-4 font-mono text-calc-screen-text shadow-inner ${getDisplayClass()} overflow-hidden break-all`}>
            {display}
        </div>
        
        <div className="grid grid-cols-4 gap-3 mt-4">
          <CalcButton variant="function" onClick={clear}>AC</CalcButton>
          <CalcButton variant="function" onClick={() => {}}>±</CalcButton>
          <CalcButton variant="function" onClick={() => {}}>%</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "÷"} onClick={() => performOperation("÷")}>÷</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("7")}>7</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("8")}>8</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("9")}>9</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "×"} onClick={() => performOperation("×")}>×</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("4")}>4</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("5")}>5</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("6")}>6</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "-"} onClick={() => performOperation("-")}>−</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("1")}>1</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("2")}>2</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("3")}>3</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "+"} onClick={() => performOperation("+")}>+</CalcButton>

          <CalcButton variant="number" className="col-span-2" onClick={() => inputDigit("0")}>0</CalcButton>
          <CalcButton variant="number" onClick={inputDecimal}>,</CalcButton>
          <CalcButton variant="operator" onClick={handleEquals}>=</CalcButton>
        </div>
      </div>

      {/* 2. CHAMP DE RÉCUPÉRATION */}
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-black"> Récupérer un résultat</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={taskIdInput}
            onChange={(e) => {
                setTaskIdInput(e.target.value);
                // Si l'utilisateur change l'ID, on efface l'ancien résultat pour éviter la confusion
                setResultMessage(null); 
            }}
            onKeyDown={handleKeyDown}
            placeholder="Collez l'ID ici et tapez Entrée..."
            className="flex-1 p-2 border border-gray-300 rounded focus:border-orange-500 outline-none text-sm text-black placeholder-gray-500"
          />
          <button 
            onClick={fetchManualResult}
            disabled={loading} 
            className={`font-bold py-2 px-4 rounded transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
          >
            {loading ? '...' : 'Vérifier'}
          </button>
        </div>
        
        {resultMessage && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-center font-mono text-black break-all font-bold">
            {resultMessage}
          </div>
        )}
      </div>

    </div>
  );
};