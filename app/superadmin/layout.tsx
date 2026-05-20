import { headers } from "next/headers";
import { requireAdmin } from "../lib/admin-auth";
import SuperAdminSidebar from "./components/Sidebar";
import DarkBody from "./components/DarkBody";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/superadmin/login") {
    return <><DarkBody />{children}</>;
  }

  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <DarkBody />
      <SuperAdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
