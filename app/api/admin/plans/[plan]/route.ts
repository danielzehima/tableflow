import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabase } from "../../../../lib/supabase-server";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  return token && token === process.env.ADMIN_SECRET;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ plan: string }> }
) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { plan } = await params;
  const body = await req.json();

  const allowed = ["label", "price", "currency", "description", "features", "highlight", "badge", "cta_text", "cta_href"] as const;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if ("features" in update && !Array.isArray(update.features)) {
    return NextResponse.json({ error: "features doit être un tableau" }, { status: 400 });
  }
  if ("price" in update && (typeof update.price !== "number" || update.price < 0)) {
    return NextResponse.json({ error: "price doit être un nombre positif" }, { status: 400 });
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
