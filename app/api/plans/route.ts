import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function GET() {
  const { data } = await supabase
    .from("plan_settings")
    .select("plan, label, price, price_yearly, currency, description, features, highlight, badge, cta_text, cta_href, sort_order")
    .order("sort_order");

  return NextResponse.json(data ?? []);
}
