import { pbkdf2Sync, randomBytes, createHmac, timingSafeEqual } from "crypto";

function stripBom(s: string): string {
  return (s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s).trim();
}

const SECRET = stripBom(process.env.AUTH_SECRET ?? "tableflow-change-in-production");
const COOKIE = "tf_session";

export { COOKIE };

export type Role = "owner" | "manager" | "waiter" | "cashier";

export type SessionPayload = {
  userId: string;
  restaurantId: string;
  role: Role;
  name: string;
  exp: number;
};

// ── Password ────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
  } catch {
    return false;
  }
}

// ── Token ────────────────────────────────────────────────────────

export function createToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(encoded).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(sig, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}

// ── Labels & couleurs ────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  owner:   "Propriétaire",
  manager: "Gérant",
  waiter:  "Serveur",
  cashier: "Cuisinier",
};

export const ROLE_COLORS: Record<Role, string> = {
  owner:   "text-orange-300 bg-orange-500/15 border-orange-500/30",
  manager: "text-blue-300 bg-blue-500/15 border-blue-500/30",
  waiter:  "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  cashier: "text-violet-300 bg-violet-500/15 border-violet-500/30",
};

// ── Permissions ───────────────────────────────────────────────────
//
// Propriétaire : tout (14 items)
// Gérant       : Vue d'ensemble, Réservations, Commandes, Analytics, Menu digital
// Serveur      : Réservations, Commandes
// Cuisinier    : Commandes, Vue Cuisine

// Réservations (item 2)
export function canAccessReservations(role: Role) {
  return role === "owner" || role === "manager" || role === "waiter";
}

// Analytics / Vue d'ensemble (items 1, 5)
export function canViewStats(role: Role) {
  return role === "owner" || role === "manager";
}

// Menu digital (item 10)
export function canManageMenu(role: Role) {
  return role === "owner" || role === "manager";
}

// Vue Cuisine (item 8)
export function canAccessKitchen(role: Role) {
  return role === "owner" || role === "cashier";
}

// Tout le reste (items 4,6,7,9,11,12,13 + Équipe) : propriétaire uniquement
export function canManageTeam(role: Role) {
  return role === "owner";
}

// Page de redirection après login selon le rôle
export function landingPage(role: Role): string {
  if (role === "waiter")  return "/dashboard/reservations";
  if (role === "cashier") return "/dashboard/commandes";
  return "/dashboard";
}
