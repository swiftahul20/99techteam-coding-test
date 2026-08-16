export default function Home({ onNavigate }) {
  return (
    <div className="aspect-square w-full max-w-md flex flex-col items-center justify-center gap-4 border border-[#1E2530] rounded-xl bg-[#151A23] px-8 text-center">
      <p className="font-['JetBrains_Mono',monospace] text-xs text-[#5EEAD4] tracking-widest uppercase">
        coding test
      </p>
      <h1 className="text-3xl font-semibold"> 99TechTeam </h1>
      <p className="text-sm text-[#7C8494] leading-relaxed">
        You can navigate to the problems using the navigation bar above or click
        the button below to start with problem 1.
      </p>
      <button
        onClick={() => onNavigate("Problem01")}
        className="mt-2 px-4 py-2 rounded-md bg-[#5EEAD4] text-[#0B0E14] font-['JetBrains_Mono',monospace] text-sm font-medium hover:bg-[#7FF3E0] transition-colors"
      >
        problem 01 →
      </button>
    </div>
  );
}
