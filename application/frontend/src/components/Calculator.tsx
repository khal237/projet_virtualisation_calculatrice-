import { useState } from "react";
import { CalcButton } from "./CalcButton";
import { CalcDisplay } from "./CalcDisplay";

type Operator = "+" | "-" | "×" | "÷" | null;

// On garde le chemin relatif pour la prod (Ingress) et le local (Nginx Proxy)
const API_URL = "/api";

export const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [activeOperator, setActiveOperator] = useState<Operator>(null);
  const [loading, setLoading] = useState(false);

  // --- LOGIQUE METIER ---

  const mapOperator = (op: Operator): string => {
    switch (op) {
      case "×": return "*";
      case "÷": return "/";
      default: return op || "+";
    }
  };

  // 1. Envoyer le calcul (POST) -> Affiche l'ID
  const submitCalculation = async (a: number, b: number, op: Operator) => {
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
      
      // ICI : On affiche directement l'ID sur l'écran de la calculatrice
      setDisplay(data.task_id);
      
      setLoading(false);
    } catch (error) {
      console.error(error);
      setDisplay("Err Envoi");
      setLoading(false);
    }
  };

  // 2. Récupérer le résultat (GET) -> Affiche le nombre
  const fetchResult = async (taskId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/result/${taskId}`);
      
      if (response.status === 404) {
        // Si pas encore prêt, on prévient l'utilisateur
        const currentId = display; // On garde l'ID en mémoire
        setDisplay("En cours...");
        setTimeout(() => setDisplay(currentId), 1500); // On réaffiche l'ID après
      } else if (response.ok) {
        const data = await response.json();
        if (data.status === "completed") {
          setDisplay(String(data.result)); // Affiche enfin le résultat !
        }
      } else {
        setDisplay("Inconnu");
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setDisplay("Err Réseau");
      setLoading(false);
    }
  };

  // --- GESTION DES TOUCHES ---

  // Le bouton "=" devient intelligent
  const handleEqualsOrFetch = () => {
    // Cas A : L'écran affiche un ID (contient des tirets ou lettres) -> On veut le résultat
    if (isNaN(Number(display)) && display.includes("-")) {
      fetchResult(display);
      return;
    }

    // Cas B : On est en train de faire un calcul -> On l'envoie
    const inputValue = parseFloat(display);
    if (previousValue !== null && operator) {
      submitCalculation(previousValue, inputValue, operator);
      
      // Reset des états de calcul, mais on garde l'ID à l'écran
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setActiveOperator(null);
    }
  };

  const inputDigit = (digit: string) => {
    if (loading) return;
    
    // Si l'écran affiche un ID ou une erreur, on efface tout au prochain chiffre
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

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setActiveOperator(null);
    setLoading(false);
  };

  // ... (Fonctions standard inchangées)
  const inputDecimal = () => { if (!display.includes(".")) setDisplay(display + "."); };

  // Helper pour ajuster la taille du texte si c'est un ID long
  const getDisplayClass = () => {
    if (display.length > 15) return "text-xs"; // Tout petit pour l'ID
    if (display.length > 10) return "text-lg";
    return "text-4xl";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-4">
      <div className="w-full max-w-sm rounded-3xl border-4 border-calc-body-border bg-calc-body p-6 shadow-[var(--calc-shadow)]">
        
        {/* Écran modifié pour gérer la taille du texte */}
        <div className={`mb-4 flex h-20 items-center justify-end rounded-xl bg-calc-screen px-4 font-mono text-calc-screen-text shadow-inner ${getDisplayClass()} overflow-hidden break-all`}>
            {display}
        </div>
        
        <div className="grid grid-cols-4 gap-3 mt-4">
          <CalcButton variant="function" onClick={clear}>AC</CalcButton>
          <CalcButton variant="function" onClick={() => {}}>±</CalcButton>
          <CalcButton variant="function" onClick={() => {}}>%</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "÷"} onClick={() => {}}>÷</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("7")}>7</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("8")}>8</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("9")}>9</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "×"} onClick={() => {}}>×</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("4")}>4</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("5")}>5</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("6")}>6</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "-"} onClick={() => {}}>−</CalcButton>

          <CalcButton variant="number" onClick={() => inputDigit("1")}>1</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("2")}>2</CalcButton>
          <CalcButton variant="number" onClick={() => inputDigit("3")}>3</CalcButton>
          <CalcButton variant="operator" isActive={activeOperator === "+"} onClick={() => {}}>+</CalcButton>

          <CalcButton variant="number" className="col-span-2" onClick={() => inputDigit("0")}>0</CalcButton>
          <CalcButton variant="number" onClick={inputDecimal}>,</CalcButton>
          
          {/* Bouton "=" Intelligent */}
          <CalcButton variant="operator" onClick={handleEqualsOrFetch}>
             {/* Petit changement visuel : Si c'est un ID, on affiche "GET" ou une loupe, sinon "=" */}
             {(isNaN(Number(display)) && display.includes("-")) ? "GET" : "="}
          </CalcButton>
        </div>
      </div>
      
      {/* Petit texte d'aide */}
      <p className="text-gray-400 text-sm text-center">
        1. Tapez le calcul et faites <b>=</b> (Reçoit l'ID)<br/>
        2. Appuyez sur <b>GET</b> pour voir le résultat.
      </p>
    </div>
  );
};