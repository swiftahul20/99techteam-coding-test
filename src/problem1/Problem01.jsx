import { useMemo, useState } from "react";

var sum_to_n_a = function (n) {
  let total = 0;
  const step = n < 0 ? -1 : 1;
  for (let i = step; step > 0 ? i <= n : i >= n; i += step) {
    total += i;
  }
  return total;
};

var sum_to_n_b = function (n) {
  const sign = n < 0 ? -1 : 1;
  const absN = Math.abs(n);
  return sign * ((absN * (absN + 1)) / 2);
};

var sum_to_n_c = function (n) {
  if (n === 0) return 0;
  const step = n < 0 ? -1 : 1;
  return n + sum_to_n_c(n - step);
};

function buildExpression(n, result) {
  if (n === 0) return `0 = ${result}`;

  const sign = n < 0 ? -1 : 1;
  const abs = Math.abs(n);
  const FULL_THRESHOLD = 8;

  if (abs <= FULL_THRESHOLD) {
    const terms = [];
    for (let i = sign; sign > 0 ? i <= n : i >= n; i += sign) {
      terms.push(i);
    }
    return `${terms.join(" + ")} = ${result}`;
  }

  const headCount = 3;
  const tailCount = 2;
  const head = Array.from({ length: headCount }, (_, i) => sign * (i + 1));
  const tail = Array.from(
    { length: tailCount },
    (_, i) => n - sign * (tailCount - 1 - i),
  );

  return `${head.join(" + ")} + ... + ${tail.join(" + ")} = ${result}`;
}

const TABS = [
  {
    id: "a",
    file: "sum_to_n_a.js",
    label: "iterative",
    fn: sum_to_n_a,
    code: `var sum_to_n_a = function (n) {
  let total = 0;
  const step = n < 0 ? -1 : 1;
  for (let i = step; step > 0 ? i <= n : i >= n; i += step) {
    total += i;
  }
  return total;
};`,
  },
  {
    id: "b",
    file: "sum_to_n_b.js",
    label: "formula",
    fn: sum_to_n_b,
    code: `var sum_to_n_b = function (n) {
  const sign = n < 0 ? -1 : 1;
  const absN = Math.abs(n);
  return sign * ((absN * (absN + 1)) / 2);
};`,
  },
  {
    id: "c",
    file: "sum_to_n_c.js",
    label: "recursive",
    fn: sum_to_n_c,
    code: `var sum_to_n_c = function (n) {
  if (n === 0) return 0;
  const step = n < 0 ? -1 : 1;
  return n + sum_to_n_c(n - step);
};`,
  },
];

export default function Challenge1() {
  const [activeTab, setActiveTab] = useState("a");
  const [input, setInput] = useState("5");

  const n = useMemo(() => {
    const parsed = parseInt(input, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [input]);

  const active = TABS.find((t) => t.id === activeTab);

  let result = null;
  let error = null;
  if (n !== null) {
    try {
      result = active.fn(n);
    } catch (e) {
      error = e.message;
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <div className="aspect-square w-full flex flex-col border border-[#1E2530] rounded-xl bg-[#151A23] overflow-hidden">
        <div className="flex border-b border-[#1E2530] font-['JetBrains_Mono',monospace] text-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-r border-[#1E2530] transition-colors ${
                activeTab === tab.id
                  ? "bg-[#0B0E14] text-[#5EEAD4]"
                  : "text-[#7C8494] hover:text-[#E7E9EE]"
              }`}
            >
              {tab.file}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-3">
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494]">
            {active.label}
          </p>
          <pre className="text-[11px] leading-relaxed font-['JetBrains_Mono',monospace] text-[#C7CCD6] whitespace-pre-wrap">
            {active.code}
          </pre>
        </div>

        <div className="border-t border-[#1E2530] bg-[#0B0E14] px-5 py-4 flex flex-col gap-2">
          <label className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494]">
            try it — n =
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-24 bg-[#151A23] border border-[#1E2530] rounded-md px-3 py-1.5 text-sm font-['JetBrains_Mono',monospace] text-[#E7E9EE] focus:outline-none focus:border-[#5EEAD4]"
            />
            <span className="text-[#3A4152]">→</span>
            <span className="font-['JetBrains_Mono',monospace] text-lg text-[#F5A623]">
              {error ? "error" : result === null ? "—" : result}
            </span>
          </div>
        </div>
      </div>

      {result !== null && !error && (
        <div className="w-full border border-[#1E2530] rounded-xl bg-[#151A23] px-5 py-4 flex flex-col gap-1.5">
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494]">
            the math
          </p>
          <p className="font-['JetBrains_Mono',monospace] text-sm text-[#E7E9EE] wrap-break-word">
            {buildExpression(n, result)}
          </p>
        </div>
      )}

      <p className="text-xs text-[#7C8494] text-center leading-relaxed max-w-sm">
        Switch tabs to compare the iterative, formula, and recursive
        implementations — the input runs against whichever one is active.
      </p>
    </div>
  );
}
