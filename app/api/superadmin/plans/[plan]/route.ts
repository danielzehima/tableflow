import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminApi } from "../../../../lib/admin-auth";
import { supabase } from "../../../../lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ plan: string }> }
) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { plan } = await params;
  const body = await req.json();

  const allowed = ["label", "price", "currency", "description", "features", "highlight", "badge", "cta_text", "cta_href"] as const;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabase
    .from("plan_settings")
    .update(update)
    .eq("plan", plan)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/");

  return NextResponse.json(data);
}
