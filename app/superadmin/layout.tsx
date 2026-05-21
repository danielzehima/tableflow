import { headers } from "next/headers";
import { requireAdmin } from "../lib/admin-auth";
import SuperAdminShell from "./components/SuperAdminShell";
import DarkBody from "./components/DarkBody";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/superadmin/login") {
    return <><DarkBody />{children}</>;
  }

  await requireAdmin();

  return (
    <>
      <DarkBody />
      <SuperAdminShell>{children}</SuperAdminShell>
    </>
  );
}
