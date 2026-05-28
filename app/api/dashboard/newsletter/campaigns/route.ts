import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { getSession } from "../../../../lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [campaignsRes, subscribersRes] = await Promise.all([
    supabase
      .from("newsletter_campaigns")
      .select("id, subject, body_text, recipient_count, sent_at")
      .eq("restaurant_id", session.restaurantId)
      .order("sent_at", { ascending: false })
      .limit(20),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", session.restaurantId)
      .not("email", "is", null)
      .neq("email", ""),
  ]);

  return NextResponse.json({
    campaigns: campaignsRes.data ?? [],
    subscriber_count: subscribersRes.count ?? 0,
  });
}
