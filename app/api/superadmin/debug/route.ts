import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.SUPERADMIN_EMAIL ?? "";
  const password = process.env.SUPERADMIN_PASSWORD ?? "";
  return NextResponse.json({
    emailSet: email.length > 0,
    emailLength: email.length,
    emailFirstChar: email[0] ?? "EMPTY",
    emailLastChar: email[email.length - 1] ?? "EMPTY",
    passwordSet: password.length > 0,
    passwordLength: password.length,
  });
}
