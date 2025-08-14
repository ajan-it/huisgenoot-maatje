import React from "react";

export function FairnessBadge({ score, onClick }: { score: number; onClick: () => void }) {
  const color = score >= 80 
    ? "bg-green-100 text-green-800 hover:bg-green-200" 
    : score >= 60 
    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
    : "bg-red-100 text-red-800 hover:bg-red-200";
  
  return (
    <button 
      onClick={onClick} 
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${color}`}
    >
      Fairness: {score}/100
    </button>
  );
}