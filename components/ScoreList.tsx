import { ScoreEntry } from "@/lib/scoreLogic";

export default function ScoreList({ scores }: { scores: ScoreEntry[] }) {
  if (scores.length === 0) {
    return <p className="text-slate-400 text-sm">No scores yet — add your first round above.</p>;
  }
  return (
    <ul className="divide-y divide-white/10">
      {scores.map((s) => (
        <li key={s.id} className="flex justify-between py-3">
          <span className="text-slate-300">{new Date(s.played_on).toLocaleDateString()}</span>
          <span className="font-semibold text-emerald-400">{s.score} pts</span>
        </li>
      ))}
    </ul>
  );
}
