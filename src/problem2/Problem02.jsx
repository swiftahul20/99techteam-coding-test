import { useEffect, useMemo, useRef, useState } from "react";

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE =
  "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

function mockBalance(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  const base = (hash % 5000) / 100; // 0 - 50
  return Math.max(base, 0.5);
}

function TokenIcon({ symbol, size = 28 }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-[#1E2530] border border-[#2A3242] flex items-center justify-center shrink-0"
      >
        <span className="text-[10px] font-['JetBrains_Mono',monospace] text-[#7C8494]">
          {symbol.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <img
      src={`${ICON_BASE}/${symbol.toUpperCase()}.svg`}
      alt={symbol}
      style={{ width: size, height: size }}
      className="rounded-full shrink-0 bg-[#1E2530]"
      onError={() => setFailed(true)}
    />
  );
}

function TokenSelector({ label, tokens, selected, onSelect, disabledSymbol }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.currency.toLowerCase().includes(q));
  }, [tokens, query]);

  return (
    <div className="relative" ref={ref}>
      <label className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494] mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 bg-[#151A23] border border-[#1E2530] rounded-lg px-10 py-2 hover:border-[#2A3242] transition-colors"
      >
        {selected ? (
          <>
            <TokenIcon symbol={selected.currency} size={22} />
            <span className="font-['JetBrains_Mono',monospace] text-sm">
              {selected.currency}
            </span>
          </>
        ) : (
          <span className="text-sm text-[#7C8494]">Select token</span>
        )}
        <span className="ml-auto text-[#3A4152] text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-hidden flex flex-col bg-[#151A23] border border-[#1E2530] rounded-lg shadow-xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search token..."
            className="px-3 py-2 text-sm bg-transparent border-b border-[#1E2530] focus:outline-none placeholder:text-[#3A4152]"
          />
          <div className="overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-[#7C8494]">
                No tokens found
              </p>
            )}
            {filtered.map((t) => (
              <button
                key={t.currency}
                type="button"
                disabled={t.currency === disabledSymbol}
                onClick={() => {
                  onSelect(t);
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  t.currency === disabledSymbol
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-[#1E2530]"
                }`}
              >
                <TokenIcon symbol={t.currency} size={20} />
                <span className="font-['JetBrains_Mono',monospace] text-sm">
                  {t.currency}
                </span>
                <span className="ml-auto text-xs text-[#7C8494]">
                  $
                  {t.price < 0.01
                    ? t.price.toExponential(2)
                    : t.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Challenge2() {
  const [tokens, setTokens] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // percent
  const [customSlippage, setCustomSlippage] = useState("");

  useEffect(() => {
    fetch(PRICES_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        // Dedupe currency keeping most recent by date.
        const latest = new Map();
        for (const entry of data) {
          if (typeof entry.price !== "number" || entry.price <= 0) continue;
          const existing = latest.get(entry.currency);
          if (!existing || new Date(entry.date) > new Date(existing.date)) {
            latest.set(entry.currency, entry);
          }
        }
        const list = Array.from(latest.values()).sort((a, b) =>
          a.currency.localeCompare(b.currency),
        );
        setTokens(list);
        setFromToken(list.find((t) => t.currency === "ETH") || list[0]);
        setToToken(list.find((t) => t.currency === "USDC") || list[1]);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const fromBalance = fromToken ? mockBalance(fromToken.currency) : 0;

  const rate = useMemo(() => {
    if (!fromToken || !toToken) return null;
    return fromToken.price / toToken.price;
  }, [fromToken, toToken]);

  const toAmount = useMemo(() => {
    const n = parseFloat(fromAmount);
    if (!rate || Number.isNaN(n)) return "";
    return (n * rate).toFixed(6);
  }, [fromAmount, rate]);

  const minimumReceived = useMemo(() => {
    const amt = parseFloat(toAmount);
    if (Number.isNaN(amt)) return "";
    return (amt * (1 - slippage / 100)).toFixed(6);
  }, [toAmount, slippage]);

  const error = useMemo(() => {
    if (!fromToken || !toToken) return null;
    if (fromToken.currency === toToken.currency)
      return "Choose two different tokens.";
    const n = parseFloat(fromAmount);
    if (fromAmount !== "" && (Number.isNaN(n) || n <= 0))
      return "Enter a valid amount greater than 0.";
    if (n > fromBalance) return "Amount exceeds your available balance.";
    return null;
  }, [fromAmount, fromToken, toToken, fromBalance]);

  const canSubmit =
    fromToken && toToken && fromAmount !== "" && !error && !submitting;

  function handleSwapDirection() {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
    setSuccess(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSuccess(false);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setFromAmount("");
    }, 1200);
  }

  if (status === "loading") {
    return (
      <div className="aspect-square w-full max-w-md flex items-center justify-center border border-[#1E2530] rounded-xl bg-[#151A23]">
        <p className="font-['JetBrains_Mono',monospace] text-sm text-[#7C8494]">
          fetching live prices…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="aspect-square w-full max-w-md flex items-center justify-center border border-[#1E2530] rounded-xl bg-[#151A23] px-6 text-center">
        <p className="font-['JetBrains_Mono',monospace] text-sm text-[#F5A623]">
          Couldn't load price data. Check your connection and refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col gap-4 border border-[#1E2530] rounded-xl bg-[#151A23] p-6"
      >
        <div>
          <h1 className="text-lg font-semibold">Swap</h1>
          <p className="text-xs text-[#7C8494] mt-0.5">
            Rates from live token price feed
          </p>
        </div>

        <div className="flex flex-col gap-2 bg-[#0B0E14] border border-[#1E2530] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494]">
              You pay
            </span>
            <button
              type="button"
              onClick={() => setFromAmount(String(fromBalance.toFixed(4)))}
              className="text-[10px] font-['JetBrains_Mono',monospace] text-[#5EEAD4] hover:underline"
            >
              balance: {fromBalance.toFixed(4)}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value);
                setSuccess(false);
              }}
              placeholder="0.00"
              className="flex-1 min-w-0 bg-transparent text-xl font-['JetBrains_Mono',monospace] focus:outline-none placeholder:text-[#3A4152]"
            />
            <TokenSelector
              label=""
              tokens={tokens}
              selected={fromToken}
              onSelect={(t) => {
                setFromToken(t);
                setSuccess(false);
              }}
              disabledSymbol={toToken?.currency}
            />
          </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={handleSwapDirection}
            className="w-9 h-9 rounded-full bg-[#0B0E14] border border-[#1E2530] flex items-center justify-center text-[#5EEAD4] hover:border-[#5EEAD4] hover:rotate-180 transition-all duration-300"
            aria-label="Reverse swap direction"
          >
            ↓↑
          </button>
        </div>

        <div className="flex flex-col gap-2 bg-[#0B0E14] border border-[#1E2530] rounded-lg p-3">
          <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494]">
            You receive
          </span>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={toAmount}
              placeholder="0.00"
              className="flex-1 min-w-0 bg-transparent text-xl font-['JetBrains_Mono',monospace] text-[#F5A623] focus:outline-none placeholder:text-[#3A4152]"
            />
            <TokenSelector
              label=""
              tokens={tokens}
              selected={toToken}
              onSelect={(t) => {
                setToToken(t);
                setSuccess(false);
              }}
              disabledSymbol={fromToken?.currency}
            />
          </div>
        </div>

        {rate && fromToken && toToken && (
          <p className="text-xs text-[#7C8494] font-['JetBrains_Mono',monospace] text-center">
            1 {fromToken.currency} ≈ {rate.toFixed(6)} {toToken.currency}
          </p>
        )}

        <div className="flex flex-col gap-2 bg-[#0B0E14] border border-[#1E2530] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest text-[#7C8494]">
              Slippage tolerance
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-[#E7E9EE]">
              {slippage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[0.1, 0.5, 1].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSlippage(preset);
                  setCustomSlippage("");
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-['JetBrains_Mono',monospace] border transition-colors ${
                  slippage === preset && customSlippage === ""
                    ? "border-[#5EEAD4] text-[#5EEAD4] bg-[#5EEAD4]/10"
                    : "border-[#1E2530] text-[#7C8494] hover:border-[#2A3242]"
                }`}
              >
                {preset}%
              </button>
            ))}
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="50"
                value={customSlippage}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomSlippage(val);
                  const n = parseFloat(val);
                  if (!Number.isNaN(n) && n >= 0) setSlippage(n);
                }}
                placeholder="custom"
                className="w-full bg-[#151A23] border border-[#1E2530] rounded-md px-3 py-1.5 text-xs font-['JetBrains_Mono',monospace] focus:outline-none focus:border-[#5EEAD4] placeholder:text-[#3A4152]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#3A4152]">
                %
              </span>
            </div>
          </div>
          {slippage > 5 && (
            <p className="text-[10px] text-[#F5A623] font-['JetBrains_Mono',monospace]">
              High slippage tolerance — you may receive a less favorable rate.
            </p>
          )}
        </div>

        {minimumReceived && toToken && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[#7C8494] font-['JetBrains_Mono',monospace]">
              Minimum received
            </span>
            <span className="text-xs text-[#E7E9EE] font-['JetBrains_Mono',monospace]">
              {minimumReceived} {toToken.currency}
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs text-[#F5A623] font-['JetBrains_Mono',monospace] text-center">
            {error}
          </p>
        )}

        {success && !error && (
          <p className="text-xs text-[#5EEAD4] font-['JetBrains_Mono',monospace] text-center">
            Swap confirmed ✓
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 rounded-lg font-['JetBrains_Mono',monospace] text-sm font-medium transition-colors ${
            canSubmit
              ? "bg-[#5EEAD4] text-[#0B0E14] hover:bg-[#7FF3E0]"
              : "bg-[#1E2530] text-[#4A5266] cursor-not-allowed"
          }`}
        >
          {submitting ? "confirming…" : "confirm swap"}
        </button>
      </form>

      <p className="text-xs text-[#7C8494] text-center leading-relaxed max-w-sm">
        Prices are fetched live from interview.switcheo.com — tokens without a
        valid price are omitted from the list. Since this feed is a static
        snapshot rather than a live order book, slippage and minimum received
        are simulated to demonstrate the UX, along with submission.
      </p>
    </div>
  );
}
