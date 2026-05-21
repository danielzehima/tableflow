import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

const VALID_STATUSES = ["pending", "preparing", "ready", "served", "paid", "cancelled"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Vérifier que la commande appartient au restaurant de l'utilisateur connecté
  const { data: existing } = await supabase
    .from("orders")
    .select("restaurant_id")
    .eq("id", id)
    .single();

  if (!existing || existing.restaurant_id !== session.restaurantId) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
