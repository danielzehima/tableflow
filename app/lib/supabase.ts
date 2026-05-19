import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  cuisine: string;
  cover_image: string;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
  menu_items: MenuItem[];
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  position: number;
};

export type Reservation = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  guests: number;
  message: string;
  status: "En attente" | "Confirmée" | "Annulée";
  created_at: string;
};

export type Order = {
  id: string;
  restaurant_id: string;
  table_number: string;
  items: string;
  total: number;
  status: "En cours" | "Servi" | "Payé" | "Annulé";
  created_at: string;
};
