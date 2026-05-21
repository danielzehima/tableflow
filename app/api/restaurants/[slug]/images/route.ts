import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { getSession } from "../../../../lib/auth-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: images } = await supabase
    .from("restaurant_images")
    .select("id, url, position")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  return NextResponse.json(images ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("id", session.restaurantId)
    .single();

  if (!restaurant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existing } = await supabase
    .from("restaurant_images")
    .select("id")
    .eq("restaurant_id", restaurant.id);

  if (existing && existing.length >= 6) {
    return NextResponse.json({ error: "Maximum 6 photos" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${restaurant.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("restaurant-images")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("restaurant-images")
    .getPublicUrl(fileName);

  const position = existing ? existing.length : 0;

  const { data: image, error: dbError } = await supabase
    .from("restaurant_images")
    .insert({ restaurant_id: restaurant.id, url: publicUrl, position })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(image, { status: 201 });
}
