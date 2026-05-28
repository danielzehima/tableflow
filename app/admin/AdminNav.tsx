"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Restaurants" },
  { href: "/admin/tarifs", label: "Tarifs" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl p-1 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TableFlow" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <span className="font-bold text-white">TableFlow</span>
            <span className="ml-2 text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  active
                    ? "bg-orange-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button onClick={logout} className="text-slate-400 hover:text-white text-sm transition-colors">
        Déconnexion
      </button>
    </div>
  );
}
