import Link from "next/link";
import { LogOut } from "lucide-react";

const sections = [
  { href: "/admin/stops", label: "Stops", desc: "Add, edit, delete bus stops" },
  { href: "/admin/routes", label: "Routes", desc: "Manage routes and direction groups" },
  { href: "/admin/route-stops", label: "Route Stops", desc: "Order stops per route" },
  { href: "/admin/schedules", label: "Schedules", desc: "Times + CSV bulk import" },
  { href: "/admin/feedback", label: "Feedback", desc: "View and resolve user feedback" },
  { href: "/admin/live-reports", label: "Live Reports", desc: "Review and delete spam reports" },
];

export default function AdminDashboard() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block p-5 bg-white border border-gray-200 rounded-xl hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <h2 className="font-bold text-gray-900">{s.label}</h2>
            <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
