import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase-server";
import { getSession } from "../../../../../lib/auth-server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: image } = await supabase
    .from("restaurant_images")
    .select("url, restaurant_id")
    .eq("id", id)
    .single();

  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (image.restaurant_id !== session.restaurantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(image.url);
    const parts = url.pathname.split("/restaurant-images/");
    if (parts[1]) {
      await supabase.storage.from("restaurant-images").remove([parts[1]]);
    }
  } catch {
    // ignore storage errors — still delete from DB
  }

  await supabase.from("restaurant_images").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
