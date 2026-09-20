import Link from "next/link";

const tiles = [
  { href: "/admin/users", title: "User management", desc: "View/edit profiles, scores, subscriptions" },
  { href: "/admin/draws", title: "Draw management", desc: "Configure logic, simulate, publish" },
  { href: "/admin/charities", title: "Charity management", desc: "Add, edit, delete charities & content" },
  { href: "/admin/winners", title: "Winners management", desc: "Verify submissions, mark payouts" },
];

export default function AdminHome() {
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Admin control center</h1>
      <p className="text-slate-400 mb-8">Five surfaces cover every operational need in the PRD.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="card hover:bg-white/10 transition">
            <h3 className="font-semibold mb-1">{t.title}</h3>
            <p className="text-sm text-slate-400">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
