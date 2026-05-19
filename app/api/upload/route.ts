import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const restaurantId = formData.get("restaurant_id") as string | null;

  if (!file || !restaurantId) {
    return NextResponse.json({ error: "Fichier et ID requis" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez jpg, png ou webp." },
      { status: 400 }
    );
  }

  const path = `covers/${restaurantId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("restaurant-images")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("restaurant-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
