import { useState } from "react";
import Home from "./pages/Home";
import Problem01 from "./problem1/Problem01";
import Problem02 from "./problem2/Problem02";
import Problem03 from "./problem3/Problem03";

const NAV_ITEMS = [
  { id: "home", label: "home" },
  { id: "Problem01", label: "problem 1" },
  { id: "Problem02", label: "problem 2" },
  { id: "Problem03", label: "problem 3" },
];

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E7E9EE] font-['Inter',sans-serif] flex flex-col">
      <header className="w-full border-b border-[#1E2530] bg-[#0B0E14]/95 backdrop-blur sticky top-0 z-10">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-1 font-['JetBrains_Mono',monospace] text-sm">
          {NAV_ITEMS.map((item, i) => (
            <div key={item.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-[#3A4152] mx-1">/</span>}
              <button
                onClick={() => setPage(item.id)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  page === item.id
                    ? "text-[#5EEAD4]"
                    : "text-[#7C8494] hover:text-[#E7E9EE]"
                }`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        {page === "home" && <Home onNavigate={setPage} />}
        {page === "Problem01" && <Problem01 />}
        {page === "Problem02" && <Problem02 />}
        {page === "Problem03" && <Problem03 />}
      </main>
      <footer className="py-6 text-center text-xs text-[#7C8494]">
        <p> 2026. Miftahul Habib </p>
      </footer>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="aspect-square w-full max-w-md flex flex-col items-center justify-center border border-[#1E2530] rounded-xl bg-[#151A23]">
      <p className="font-['JetBrains_Mono',monospace] text-[#7C8494] text-sm">
        {title} — coming soon
      </p>
    </div>
  );
}
