import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";
import { hashPassword } from "../../lib/auth";

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
  const { restaurant, email, phone, password, ownerName } = body;

  if (!restaurant || !email || !password) {
    return NextResponse.json(
      { error: "Nom, email et mot de passe obligatoires" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères" },
      { status: 400 }
    );
  }

  // Check if email already exists as a restaurant user
  const { data: existingUser } = await supabase
    .from("restaurant_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json(
      { error: "Cet email est déjà associé à un compte" },
      { status: 409 }
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

  // Calcul de la fin d'essai (14 jours à partir de maintenant)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // Create the restaurant
  const { data: rest, error: restError } = await supabase
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
      plan: "free",
      status: "active",
    })
    .select("id, slug, name")
    .single();

  if (restError || !rest) {
    return NextResponse.json({ error: restError?.message ?? "Erreur création restaurant" }, { status: 500 });
  }

  // Create the owner user
  const { error: userError } = await supabase.from("restaurant_users").insert({
    restaurant_id: rest.id,
    name: ownerName || restaurant,
    email,
    password_hash: hashPassword(password),
    role: "owner",
    active: true,
  });

  if (userError) {
    // Rollback: delete the restaurant
    await supabase.from("restaurants").delete().eq("id", rest.id);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ slug: rest.slug, id: rest.id, name: rest.name });
}
