import { useEffect, useRef, useState } from "react";

const ISSUES = [
  {
    title: "Undefined variable `lhsPriority`",
    body: "The filter referenced lhsPriority, but only balancePriority was declared — a ReferenceError at runtime. Fixed by using getPriority(balance.blockchain) directly in the condition.",
    lines: [37, 41],
    originalLines: [40, 41],
  },
  {
    title: "Filter logic is inverted",
    body: "Returned true (kept the item) when amount <= 0. A wallet list should keep positive balances and drop empty ones — flipped to balance.amount > 0.",
    lines: [37, 41],
    originalLines: [41, 45],
  },
  {
    title: "`blockchain` missing from WalletBalance",
    body: "balance.blockchain was read but never declared on the interface. Added as a proper field.",
    lines: [1, 5],
    originalLines: [1, 4],
  },
  {
    title: "`getPriority(blockchain: any)`",
    body: "Threw away type safety on the one param that should be a string (or union type).",
    lines: [26, 27],
    originalLines: [21, 21],
  },
  {
    title: "getPriority recreated every render",
    body: "It's a pure function with no dependency on props/state — hoisted outside the component so it's defined once, not on every render.",
    lines: [24, 27],
    originalLines: [21, 36],
  },
  {
    title: "Sort comparator missing the equal case",
    body: "Fell through to undefined when priorities matched, causing unstable sort behavior. Replaced with a single subtraction that always returns a number.",
    lines: [42, 42],
    originalLines: [47, 55],
  },
  {
    title: "useMemo depends on `prices` but never used it",
    body: "The old computation ignored prices entirely despite listing it as a dependency. Now prices is actually read inside the memoized block, so the dependency is honest.",
    lines: [44, 50],
    originalLines: [38, 56],
  },
  {
    title: "formattedBalances computed but unused",
    body: "A second .map() built formatted balances that were never read — rows used sortedBalances instead. Collapsed into one map that produces the final shape directly.",
    lines: [43, 49],
    originalLines: [58, 63],
  },
  {
    title: "Redundant array passes",
    body: "filter → sort → map → map, four full iterations. Now a single chained pass inside one useMemo.",
    lines: [36, 50],
    originalLines: [38, 76],
  },
  {
    title: "Array index used as key",
    body: "key={index} risks React misattributing DOM nodes when the list re-sorts. Replaced with a stable id built from blockchain + currency.",
    lines: [58, 58],
    originalLines: [70, 70],
  },
  {
    title: "No fallback for missing prices",
    body: "prices[balance.currency] could be undefined, producing NaN. Guarded with ?? 0.",
    lines: [47, 47],
    originalLines: [66, 66],
  },
  {
    title: "children destructured but never rendered",
    body: "Any children passed into WalletPage were silently dropped. Now rendered alongside the rows.",
    lines: [29, 54],
    originalLines: [78, 82],
  },
  {
    title: "`.toFixed()` with no argument",
    body: "Defaulted to 0 decimal places, unlikely to be intended for a currency amount. Set to 2 explicitly.",
    lines: [46, 46],
    originalLines: [61, 61],
  },
  {
    title: "Empty `interface Props extends BoxProps {}`",
    body: "Added nothing over a type alias. Simplified to type Props = BoxProps.",
    lines: [12, 12],
    originalLines: [12, 14],
  },
];

const ORIGINAL_CODE = `interface WalletBalance {
  currency: string;
  amount: number;
}

interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

interface Props extends BoxProps {

}

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const getPriority = (blockchain: any): number => {
    switch (blockchain) {
      case 'Osmosis':
        return 100
      case 'Ethereum':
        return 50
      case 'Arbitrum':
        return 30
      case 'Zilliqa':
        return 20
      case 'Neo':
        return 20
      default:
        return -99
    }
  }

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
      const balancePriority = getPriority(balance.blockchain);
      if (lhsPriority > -99) {
        if (balance.amount <= 0) {
          return true;
        }
      }
      return false
    }).sort((lhs: WalletBalance, rhs: WalletBalance) => {
      const leftPriority = getPriority(lhs.blockchain);
      const rightPriority = getPriority(rhs.blockchain);
      if (leftPriority > rightPriority) {
        return -1;
      } else if (rightPriority > leftPriority) {
        return 1;
      }
    });
  }, [balances, prices]);

  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
    }
  })

  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}`;

const REFACTORED_CODE = `interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

type Props = BoxProps;

const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const DEFAULT_PRIORITY = -99;

// Pure function, no closure deps — lives outside the component
// so it isn't recreated every render.
const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? DEFAULT_PRIORITY;

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Single pass: filter, sort, and format together.
  // Depends only on what it actually reads.
  const rows = useMemo(() => {
    return balances
      .filter(
        (balance) =>
          getPriority(balance.blockchain) > DEFAULT_PRIORITY &&
          balance.amount > 0
      )
      .sort((lhs, rhs) => getPriority(rhs.blockchain) - getPriority(lhs.blockchain))
      .map(
        (balance): FormattedWalletBalance => ({
          ...balance,
          formatted: balance.amount.toFixed(2),
          usdValue: (prices[balance.currency] ?? 0) * balance.amount,
        })
      );
  }, [balances, prices]);

  return (
    <div {...rest}>
      {children}
      {rows.map((balance) => (
        <WalletRow
          className={classes.row}
          key={\`\${balance.blockchain}-\${balance.currency}\`}
          amount={balance.amount}
          usdValue={balance.usdValue}
          formattedAmount={balance.formatted}
        />
      ))}
    </div>
  );
};

export default WalletPage;`;

const REFACTORED_LINES = REFACTORED_CODE.split("\n");
const ORIGINAL_LINES = ORIGINAL_CODE.split("\n");

export default function Problem03() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState("refactored");
  const lineRefs = useRef({});
  const active = ISSUES[activeIndex];

  const codeLines = view === "original" ? ORIGINAL_LINES : REFACTORED_LINES;
  const highlightRange =
    view === "original" ? active.originalLines : active.lines;

  useEffect(() => {
    lineRefs.current = {};
  }, [view]);

  useEffect(() => {
    const startLine = highlightRange[0];
    const el = lineRefs.current[startLine];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, view]);

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-4">
      <div className="w-full grid grid-cols-1 md:grid-cols-[300px_1fr] border border-[#1E2530] rounded-xl bg-[#151A23] overflow-hidden">
        <div className="border-b md:border-b-0 md:border-r border-[#1E2530] max-h-128 overflow-y-auto">
          {ISSUES.map((issue, i) => (
            <button
              key={issue.title}
              onClick={() => setActiveIndex(i)}
              className={`w-full text-left px-4 py-3 border-b border-[#1E2530] flex gap-3 transition-colors ${
                i === activeIndex
                  ? "bg-[#0B0E14] border-l-2 border-l-[#5EEAD4]"
                  : "border-l-2 border-l-transparent hover:bg-[#0B0E14]/50"
              }`}
            >
              <span
                className={`font-['JetBrains_Mono',monospace] text-xs shrink-0 mt-0.5 ${
                  i === activeIndex ? "text-[#5EEAD4]" : "text-[#3A4152]"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`text-sm leading-snug ${
                  i === activeIndex ? "text-[#E7E9EE]" : "text-[#7C8494]"
                }`}
              >
                {issue.title}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-[#1E2530] bg-[#0B0E14] flex items-start justify-between gap-4">
            <div>
              <p className="font-['JetBrains_Mono',monospace] text-xs text-[#5EEAD4] mb-1">
                {view === "original"
                  ? "original.tsx (buggy)"
                  : "refactored.tsx"}
              </p>
              <p className="text-xs text-[#7C8494] leading-relaxed">
                {active.body}
              </p>
            </div>
            <button
              onClick={() =>
                setView((v) => (v === "original" ? "refactored" : "original"))
              }
              className="shrink-0 px-3 py-1.5 rounded-md text-xs font-['JetBrains_Mono',monospace] border border-[#1E2530] text-[#7C8494] hover:border-[#5EEAD4] hover:text-[#5EEAD4] transition-colors whitespace-nowrap"
            >
              {view === "original" ? "see refactored" : "see original code"}
            </button>
          </div>
          <div className="max-h-128 overflow-auto">
            <pre className="text-[11px] leading-relaxed font-['JetBrains_Mono',monospace] m-0">
              {codeLines.map((line, i) => {
                const lineNo = i + 1;
                const isHighlighted =
                  lineNo >= highlightRange[0] && lineNo <= highlightRange[1];
                return (
                  <div
                    key={lineNo}
                    ref={(el) => (lineRefs.current[lineNo] = el)}
                    className={`flex px-5 ${
                      isHighlighted
                        ? view === "original"
                          ? "bg-[#F5A623]/10"
                          : "bg-[#5EEAD4]/10"
                        : ""
                    }`}
                  >
                    <span className="w-7 shrink-0 text-right pr-3 text-[#3A4152] select-none">
                      {lineNo}
                    </span>
                    <span
                      className={`whitespace-pre ${
                        isHighlighted ? "text-[#E7E9EE]" : "text-[#C7CCD6]"
                      }`}
                    >
                      {line || " "}
                    </span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#7C8494] text-center leading-relaxed max-w-md">
        Click an issue on the left — the matching lines highlight on the right.
        Toggle between the refactored fix and the original buggy code for the
        same issue.
      </p>
    </div>
  );
}
