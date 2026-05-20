import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

const MIGRATIONS = `
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
`;

export async function POST() {
  // Utilise l'API Supabase PostgreSQL REST via service role
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1].split(".")[0];

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: MIGRATIONS }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    // Fallback: try via rpc if management API isn't available
    const { error } = await supabase.rpc("exec_migration", { sql: MIGRATIONS });
    if (error) {
      return NextResponse.json(
        { error: "Migration impossible automatiquement. Exécutez le SQL manuellement.", sql: MIGRATIONS },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, message: "Migration appliquée avec succès" });
}
