import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { sendReservationStatusUpdate } from "../../../lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notification au client si statut pertinent — non bloquante
  if (status === "Confirmée" || status === "Annulée") {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", data.restaurant_id)
      .single();

    if (restaurant) {
      await sendReservationStatusUpdate({
        customerEmail: data.customer_email ?? null,
        customerPhone: data.customer_phone,
        customerName: data.customer_name,
        restaurantName: restaurant.name,
        date: data.date,
        time: data.time,
        guests: data.guests,
        status,
      });
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
