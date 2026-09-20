import Link from "next/link";

export default function Home() {
  return (
    <div className="px-8 py-16 max-w-5xl mx-auto">
      <p className="text-emerald-400 text-sm tracking-widest uppercase mb-4">Play. Give. Win.</p>
      <h1 className="text-5xl font-bold leading-tight mb-6">
        Every round you play<br />can change someone's life.
      </h1>
      <p className="text-slate-300 max-w-xl mb-8">
        Track your Stableford scores, enter the monthly prize draw, and send part of
        your subscription straight to a charity you choose — no spreadsheets, no clubhouse required.
      </p>
      <div className="flex gap-4 mb-20">
        <Link href="/signup" className="btn-primary">Create your account</Link>
        <Link href="/charities" className="btn-secondary">See the charities</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-2">1. Enter your scores</h3>
          <p className="text-sm text-slate-400">Log your last 5 rounds. We keep the most recent five, always.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">2. Join the monthly draw</h3>
          <p className="text-sm text-slate-400">5, 4, or 3-number matches split a live prize pool. Unclaimed jackpots roll over.</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">3. Support your cause</h3>
          <p className="text-sm text-slate-400">At least 10% of every subscription goes to the charity you pick — you can give more anytime.</p>
        </div>
      </div>
    </div>
  );
}
