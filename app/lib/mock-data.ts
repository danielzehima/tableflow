export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  cuisine: string;
  menu: MenuCategory[];
};

export const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    slug: "le-bonus",
    name: "Le Bonus",
    tagline: "Saveurs authentiques, ambiance chaleureuse",
    description:
      "Restaurant de cuisine africaine et internationale avec une terrasse accueillante, idéal pour vos soirées en famille ou entre amis.",
    coverImage: "/hero-restaurant.png",
    phone: "+225 07 00 00 00",
    email: "contact@lebonus.ci",
    address: "Abidjan, Côte d'Ivoire",
    hours: "Lun – Dim : 11h00 – 23h00",
    cuisine: "Africaine & Internationale",
    menu: [
      {
        id: "entrees",
        name: "Entrées",
        items: [
          {
            id: "e1",
            name: "Salade de crudités",
            description: "Mélange de légumes frais de saison",
            price: 2500,
            available: true,
          },
          {
            id: "e2",
            name: "Soupe du jour",
            description: "Préparée chaque matin avec des produits du marché",
            price: 2000,
            available: true,
          },
          {
            id: "e3",
            name: "Accras de poisson",
            description: "Beignets croustillants, sauce pimentée maison",
            price: 3500,
            available: true,
          },
        ],
      },
      {
        id: "plats",
        name: "Plats principaux",
        items: [
          {
            id: "p1",
            name: "Poulet braisé",
            description: "Mariné aux épices locales, riz ou attiéké, sauce tomate",
            price: 6500,
            available: true,
          },
          {
            id: "p2",
            name: "Poisson braisé",
            description: "Tilapia frais grillé au feu de bois, légumes sautés",
            price: 8000,
            available: true,
          },
          {
            id: "p3",
            name: "Thiéboudienne",
            description: "Riz au poisson sénégalais, légumes et sauce rouge",
            price: 7500,
            available: true,
          },
          {
            id: "p4",
            name: "Côte de bœuf",
            description: "300g, sauce poivre ou béarnaise, frites maison",
            price: 12000,
            available: false,
          },
        ],
      },
      {
        id: "cocktails",
        name: "Cocktails & Boissons",
        items: [
          {
            id: "c1",
            name: "Long Island",
            description: "Vodka, gin, rhum, tequila, triple sec, citron",
            price: 9000,
            available: true,
          },
          {
            id: "c2",
            name: "Mojito",
            description: "Rhum blanc, menthe fraîche, citron vert, sucre de canne",
            price: 7000,
            available: true,
          },
          {
            id: "c3",
            name: "Bissap maison",
            description: "Fleurs d'hibiscus, gingembre, citron vert",
            price: 1500,
            available: true,
          },
          {
            id: "c4",
            name: "Gingembre citron",
            description: "Boisson fraîche maison, zeste de citron vert",
            price: 1200,
            available: true,
          },
        ],
      },
      {
        id: "desserts",
        name: "Desserts",
        items: [
          {
            id: "d1",
            name: "Bananes flambées",
            description: "Bananes plantain caramélisées, glace vanille",
            price: 3000,
            available: true,
          },
          {
            id: "d2",
            name: "Fondant au chocolat",
            description: "Cœur coulant, crème anglaise maison",
            price: 3500,
            available: true,
          },
        ],
      },
    ],
  },
];

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  return mockRestaurants.find((r) => r.slug === slug);
}

export const dashboardStats = [
  {
    label: "Revenus du jour",
    value: "1 245 000 FCFA",
    change: "+12%",
    positive: true,
    icon: "💰",
    sub: "vs mois dernier",
  },
  {
    label: "Commandes actives",
    value: "47",
    change: "+5",
    positive: true,
    icon: "🛎️",
    sub: "aujourd'hui",
  },
  {
    label: "Réservations ce soir",
    value: "23",
    change: "-2",
    positive: false,
    icon: "📅",
    sub: "vs hier soir",
  },
  {
    label: "Nouveaux clients",
    value: "8",
    change: "+3",
    positive: true,
    icon: "👥",
    sub: "cette semaine",
  },
];

export const recentOrders = [
  {
    id: "#001",
    table: "Table 4",
    items: "Poulet braisé × 2, Bissap × 2",
    total: 15700,
    status: "En cours",
    time: "Il y a 5 min",
  },
  {
    id: "#002",
    table: "Table 7",
    items: "Poisson braisé × 1, Fondant × 1",
    total: 11500,
    status: "Servi",
    time: "Il y a 12 min",
  },
  {
    id: "#003",
    table: "Table 1",
    items: "Thiéboudienne × 3",
    total: 22500,
    status: "Servi",
    time: "Il y a 25 min",
  },
  {
    id: "#004",
    table: "Table 9",
    items: "Long Island × 2, Côte de bœuf × 2",
    total: 42000,
    status: "Payé",
    time: "Il y a 40 min",
  },
];

export const upcomingReservations = [
  {
    name: "Famille Koné",
    guests: 6,
    date: "Aujourd'hui 19h30",
    status: "Confirmée",
  },
  {
    name: "Jean-Paul Diallo",
    guests: 2,
    date: "Aujourd'hui 20h00",
    status: "Confirmée",
  },
  {
    name: "Anniversaire Martin",
    guests: 12,
    date: "Demain 20h30",
    status: "En attente",
  },
  {
    name: "Réunion d'affaires",
    guests: 8,
    date: "Demain 12h30",
    status: "Confirmée",
  },
];
