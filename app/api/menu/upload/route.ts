import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function POST(req: Request) {
  // Vérification basique de session
  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie.includes("tf_session=")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const restaurantId = formData.get("restaurant_id") as string | null;

  if (!file || !restaurantId) {
    return NextResponse.json({ error: "Fichier et restaurant_id requis" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "L'image ne doit pas dépasser 5 Mo" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${restaurantId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("menu-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
