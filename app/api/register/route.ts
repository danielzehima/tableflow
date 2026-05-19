import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { restaurant, email, phone } = body;

  if (!restaurant || !email) {
    return NextResponse.json(
      { error: "Nom du restaurant et email obligatoires" },
      { status: 400 }
    );
  }

  let slug = toSlug(restaurant);
  if (!slug) slug = "restaurant";

  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      name: restaurant,
      slug,
      email,
      phone: phone ?? "",
      description: `Bienvenue chez ${restaurant}. Découvrez notre carte et réservez votre table en ligne.`,
      tagline: "Une expérience culinaire inoubliable",
      address: "À définir",
      hours: "Lun-Sam : 12h-22h",
      cuisine: "À définir",
      cover_image: "",
    })
    .select("id, slug, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug: data.slug, id: data.id, name: data.name });
}
