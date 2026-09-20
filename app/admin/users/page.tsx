"use client";
import { useEffect, useState } from "react";

/**
 * Reads from `profiles` joined with `subscriptions` via a Supabase RPC/view
 * in production (see README). For this sample, wire this page to a
 * `/api/admin/users` GET route that runs:
 *   select p.*, s.plan, s.status from profiles p
 *   left join subscriptions s on s.user_id = p.id and s.status = 'active'
 */
export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((b) => setUsers(b.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User management</h1>
      <div className="card">
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-left">
            <tr><th className="pb-2">Name</th><th>Plan</th><th>Status</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="py-2">{u.full_name}</td>
                <td>{u.plan ?? "—"}</td>
                <td>{u.status ?? "inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-slate-400 text-sm py-4">No users yet, or /api/admin/users not implemented in this sample — see comment in source.</p>}
      </div>
    </div>
  );
}
