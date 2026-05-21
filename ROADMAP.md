# TableFlow — Roadmap d'amélioration

Ce fichier liste toutes les fonctionnalités à implémenter dans l'ordre de priorité.
Chaque feature est décrite avec les fichiers à créer/modifier et le comportement exact attendu.

---

## STATUT DES FEATURES

| # | Feature | Statut |
|---|---------|--------|
| 1 | Notifications commandes en temps réel | ✅ Terminé |
| 2 | Affichage cuisine (Kitchen Display) | ✅ Terminé |
| 3 | Statistiques restaurant | ✅ Terminé |
| 4 | Personnalisation de la page menu | ✅ Terminé |
| 5 | Avis clients post-commande | ✅ Terminé |
| 6 | Export commandes PDF/Excel | ✅ Terminé |
| 7 | Page d'onboarding guidée | ✅ Terminé |
| 8 | Mode démo public | ✅ Terminé |

---

## FEATURE 1 — Notifications commandes en temps réel

### Objectif
Dès qu'un client passe une commande depuis la page publique du restaurant, le dashboard affiche une notification (badge rouge + son) sans avoir à rafraîchir la page.

### Technologie
Server-Sent Events (SSE) — pas de WebSocket, plus simple avec Next.js App Router.

### Fichiers à créer
- `app/api/orders/stream/route.ts` — endpoint SSE qui pousse les nouvelles commandes
- `app/dashboard/components/OrderNotificationBell.tsx` — cloche avec badge dans le header du dashboard

### Fichiers à modifier
- `app/api/orders/route.ts` — après INSERT commande, émettre l'événement SSE
- `app/dashboard/components/DashboardShell.tsx` — ajouter `<OrderNotificationBell>` dans le header

### Comportement exact
1. Le dashboard ouvre une connexion SSE vers `/api/orders/stream?restaurant_id=xxx`
2. Quand une nouvelle commande arrive, le serveur pousse `{ orderId, table, total, items }` via SSE
3. La cloche affiche un badge rouge avec le nombre de commandes non lues
4. Un son "ding" est joué (Audio API, fichier `/public/sounds/order.mp3`)
5. En cliquant sur la cloche → liste déroulante des 5 dernières commandes non lues
6. En cliquant sur une commande → redirige vers `/dashboard/commandes`
7. Les commandes sont marquées "lues" après clic ou après 30 secondes

---

## FEATURE 2 — Affichage cuisine (Kitchen Display System)

### Objectif
Un écran séparé, accessible sur `/dashboard/cuisine`, affiche en temps réel toutes les commandes en cours avec leur statut. Conçu pour être affiché sur une tablette ou un écran en cuisine.

### Fichiers à créer
- `app/dashboard/cuisine/page.tsx` — page principale KDS
- `app/dashboard/cuisine/KitchenCard.tsx` — carte d'une commande en cuisine
- `app/api/orders/[id]/status/route.ts` — PATCH pour changer le statut d'une commande

### Fichiers à modifier
- Aucun fichier existant à modifier (nouvelle page autonome)

### Comportement exact
1. Page plein écran, fond sombre, conçue pour rester ouverte en permanence
2. Les commandes sont divisées en 3 colonnes : **En attente** | **En préparation** | **Prêt**
3. Chaque carte affiche : numéro de table, heure de commande, liste des plats avec quantités
4. Timer visible sur chaque carte (temps écoulé depuis la commande)
5. Boutons sur chaque carte :
   - "Démarrer" → passe de "En attente" à "En préparation"
   - "Prêt" → passe de "En préparation" à "Prêt"
   - "Livré" → archive la commande (disparaît de l'écran)
6. Les commandes "En attente" depuis plus de 5 min clignotent en rouge
7. Mise à jour automatique via SSE (même endpoint que Feature 1)
8. Accès réservé aux rôles : owner, manager, waiter

### Statuts commande en base
La table `orders` doit avoir une colonne `kitchen_status` avec les valeurs : `pending` | `preparing` | `ready` | `delivered`

---

## FEATURE 3 — Statistiques restaurant

### Objectif
Une page `/dashboard/statistiques` avec des graphiques simples sur les performances du restaurant.

### Fichiers à créer
- `app/dashboard/statistiques/page.tsx` — page stats
- `app/api/stats/restaurant/route.ts` — API qui retourne les données agrégées

### Fichiers à modifier
- `app/dashboard/components/Sidebar.tsx` — ajouter le lien "Statistiques" dans le menu

### Comportement exact
La page affiche les blocs suivants :

**Bloc 1 — Résumé du jour**
- Chiffre d'affaires du jour (somme des commandes payées aujourd'hui)
- Nombre de commandes du jour
- Ticket moyen du jour
- Comparaison avec hier (flèche verte/rouge + pourcentage)

**Bloc 2 — Graphique 7 derniers jours**
- Graphique en barres : chiffre d'affaires par jour sur les 7 derniers jours
- Utiliser la librairie `recharts` (à installer)

**Bloc 3 — Top 5 plats les plus commandés**
- Liste avec nom du plat, nombre de fois commandé, revenus générés
- Tri par quantité commandée (descendant)

**Bloc 4 — Heures de pointe**
- Graphique en barres : nombre de commandes par tranche horaire (8h-22h)
- Permet au restaurateur de voir ses heures chargées

**Filtres disponibles**
- Sélecteur de période : Aujourd'hui / 7 jours / 30 jours / Ce mois
- Les graphiques se mettent à jour selon la période choisie

---

## FEATURE 4 — Personnalisation de la page menu

### Objectif
Permettre au restaurateur de personnaliser l'apparence de sa page publique depuis le dashboard.

### Fichiers à créer
- `app/dashboard/personnalisation/page.tsx` — page de personnalisation

### Fichiers à modifier
- `app/dashboard/components/Sidebar.tsx` — ajouter lien "Personnalisation"
- `app/[restaurantSlug]/RestaurantPageClient.tsx` — lire et appliquer les settings de personnalisation
- `app/[restaurantSlug]/page.tsx` — récupérer les settings depuis Supabase

### Champs de personnalisation
La table `restaurants` doit recevoir ces colonnes (migration SQL à écrire) :
- `primary_color` (text, défaut: `#f97316`) — couleur principale (orange par défaut)
- `cover_image` (text) — URL photo de couverture (déjà existant ?)
- `welcome_message` (text) — message d'accueil affiché sous le nom

### Comportement exact
**Page dashboard `/dashboard/personnalisation` :**
1. Formulaire avec :
   - Sélecteur de couleur principale (color picker HTML natif)
   - Upload photo de couverture (vers Supabase Storage)
   - Champ texte "Message d'accueil" (max 120 caractères)
2. Bouton "Enregistrer" → PATCH `/api/restaurants/[id]/settings`
3. Bouton "Voir ma page" → ouvre la page publique dans un nouvel onglet
4. Prévisualisation live en temps réel des changements de couleur

**Page publique du restaurant :**
- La couleur principale remplace le orange fixe `#f97316` partout (boutons, prix, accents)
- Le message d'accueil s'affiche sous le nom du restaurant

---

## FEATURE 5 — Avis clients post-commande

### Objectif
Après qu'un client finalise une commande, lui proposer de laisser un avis (note + commentaire). Les avis apparaissent sur la page publique du restaurant.

### Fichiers à créer
- `app/api/reviews/route.ts` — POST pour soumettre un avis, GET pour lister les avis d'un restaurant
- `app/dashboard/avis/page.tsx` — page dashboard pour voir et gérer les avis reçus

### Fichiers à modifier
- `app/[restaurantSlug]/RestaurantPageClient.tsx` — afficher le formulaire d'avis après commande confirmée + afficher les avis en bas de page
- `app/dashboard/components/Sidebar.tsx` — ajouter lien "Avis clients"

### Table Supabase à créer
```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  customer_name text,
  created_at timestamptz default now()
);
```

### Comportement exact
**Côté client (page publique) :**
1. Après la confirmation de commande, afficher une modale : "Votre commande est envoyée ! Laissez un avis ?"
2. Formulaire : 5 étoiles cliquables + champ commentaire (optionnel) + prénom (optionnel)
3. Bouton "Envoyer l'avis" + lien "Non merci"
4. En bas de la page publique, section "Avis clients" avec les 10 derniers avis
5. Afficher la note moyenne sous le nom du restaurant (ex: ★ 4.6)

**Côté dashboard `/dashboard/avis` :**
1. Liste de tous les avis avec : note, commentaire, date, table/commande liée
2. Filtre par note (1★ à 5★)
3. Note moyenne globale affichée en haut de la page
4. Bouton "Répondre" (optionnel, v2)

---

## FEATURE 6 — Export commandes PDF/Excel

### Objectif
Le restaurateur peut exporter le journal de ses commandes en PDF ou Excel pour sa comptabilité.

### Fichiers à créer
- `app/api/export/orders/route.ts` — génère et retourne le fichier

### Fichiers à modifier
- `app/dashboard/commandes/page.tsx` — ajouter bouton "Exporter"

### Librairies à installer
- `xlsx` — pour l'export Excel (`.xlsx`)
- `jspdf` + `jspdf-autotable` — pour l'export PDF

### Comportement exact
1. Sur la page commandes, bouton "Exporter" en haut à droite
2. Menu déroulant : "Excel (.xlsx)" | "PDF"
3. Filtres appliqués : la même période que le filtre actif sur la page (aujourd'hui / 7j / 30j)
4. Le fichier téléchargé contient les colonnes :
   - Date/Heure | Table | Articles | Total | Statut
5. Nom du fichier : `commandes-[nom-restaurant]-[date].xlsx`
6. Le PDF inclut le logo TableFlow + nom du restaurant en en-tête

---

## FEATURE 7 — Page d'onboarding guidée

### Objectif
Après l'inscription, guider le restaurateur en 3 étapes pour configurer son compte avant d'accéder au dashboard.


### Fichiers à créer
- `app/dashboard/onboarding/page.tsx` — wizard d'onboarding
- `app/api/onboarding/complete/route.ts` — marque l'onboarding comme terminé

### Fichiers à modifier
- `app/dashboard/layout.tsx` — si `restaurant.onboarding_done = false`, rediriger vers `/dashboard/onboarding`

### Colonne Supabase à ajouter
`onboarding_done boolean default false` sur la table `restaurants`

### Comportement exact
**Étape 1 — Informations du restaurant**
- Champs : Nom, description, téléphone, adresse, cuisine (type de cuisine)
- Pré-remplis avec les données existantes

**Étape 2 — Créer le premier plat**
- Formulaire simplifié : nom du plat, prix, catégorie
- Bouton "Ajouter un autre plat" (max 3 en onboarding)
- Possibilité de passer cette étape

**Étape 3 — Votre QR Code est prêt !**
- Affiche le QR code du restaurant
- Bouton "Télécharger le QR Code"
- Bouton "Voir ma page menu" 
- Bouton "Accéder au dashboard" → marque `onboarding_done = true` et redirige

**UI :**
- Barre de progression en haut (Étape 1/3, 2/3, 3/3)
- Design cohérent avec le reste du dashboard

---

## FEATURE 8 — Mode démo public

### Objectif
Un restaurant fictif pré-rempli accessible sans compte sur `/demo` pour que les prospects testent TableFlow avant de s'inscrire.

### Fichiers à créer
- `app/demo/page.tsx` — redirige vers la page publique du restaurant démo
- Script SQL pour insérer les données du restaurant démo dans Supabase

### Fichiers à modifier
- `app/page.tsx` (landing page) — ajouter un bouton "Voir la démo" bien visible
- `app/components/Navbar.tsx` — ajouter lien "Démo" dans la navigation

### Comportement exact
1. Un restaurant fictif "Le Bistro TableFlow" existe en base avec le slug `demo`
2. Il est pré-rempli avec des catégories et plats réalistes (entrées, plats, desserts, boissons)
3. La page `/demo` redirige vers `/{slug-demo}?table=5`
4. Sur la page démo, une bannière en haut indique "Ceci est une démo — Les commandes ne sont pas réelles"
5. Les commandes passées en mode démo sont ignorées (ou enregistrées avec un flag `is_demo=true`)
6. Le restaurant démo ne peut pas être supprimé depuis le superadmin (protection en dur)

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. **Feature 1** (Notifications temps réel) — Impact immédiat sur l'expérience
2. **Feature 2** (Kitchen Display) — Complète la Feature 1 naturellement
3. **Feature 3** (Statistiques) — Rétention des abonnés
4. **Feature 7** (Onboarding) — Acquisition de nouveaux clients
5. **Feature 8** (Mode démo) — Conversion des prospects
6. **Feature 4** (Personnalisation) — Différenciation
7. **Feature 5** (Avis clients) — Engagement
8. **Feature 6** (Export PDF/Excel) — Confort comptable

---

## ROADMAP V2 — Prochaines fonctionnalités proposées

| # | Feature | Statut | Priorité |
|---|---------|--------|----------|
| 9  | Paiement mobile money (CinetPay, Orange Money, Wave) | A faire | Haute |
| 10 | PWA — dashboard installable sur téléphone | ❌ Annulé | Haute |
| 11 | Notifications commandes par WhatsApp | A faire | Moyenne |
| 12 | Plan de salle visuel (tables libres / occupées) | ✅ Terminé | Moyenne |

---

## FEATURE 9 — Paiement mobile money intégré

### Objectif
Le client peut payer sa commande directement depuis la page menu via CinetPay, Orange Money ou Wave, avant ou après avoir passé la commande.

### Impact
Débloquer le paiement sans espèces — fonctionnalité clé pour les restaurants ivoiriens et africains.

### Pistes d'implémentation
- Intégration API CinetPay (agrégateur qui couvre Orange Money, MTN, Wave, Moov)
- Bouton "Payer" sur la page publique après confirmation de commande
- Webhook CinetPay pour confirmer le paiement côté serveur
- Statut de paiement affiché dans le dashboard (`paid` / `pending` / `failed`)

---

## FEATURE 10 — PWA (Progressive Web App)

### Objectif
Transformer le dashboard en application installable sur téléphone (Android/iOS). Le restaurateur ajoute TableFlow à son écran d'accueil comme une vraie app.

### Impact
Meilleure rétention, accès rapide sans navigateur, expérience mobile native.

### Pistes d'implémentation
- Ajouter `manifest.json` avec icônes et thème orange
- Service Worker pour mise en cache des pages du dashboard
- Métadonnées `apple-mobile-web-app-*` pour iOS
- Banner "Installer l'app" dans le header du dashboard

---

## FEATURE 11 — Notifications commandes par WhatsApp

### Objectif
Quand un client passe une commande, le restaurant reçoit automatiquement un message WhatsApp avec les détails (table, plats, total).

### Impact
Plus fiable que les notifications SSE quand le dashboard est fermé. Le restaurateur est toujours alerté.

### Pistes d'implémentation
- API WhatsApp Business (Meta) ou Twilio WhatsApp
- Le restaurateur renseigne son numéro WhatsApp dans les paramètres
- Message envoyé après chaque INSERT dans `orders`
- Template de message : "Nouvelle commande — Table X — Total : XXXX FCFA"

---

## FEATURE 12 — Plan de salle visuel

### Objectif
Une vue graphique du restaurant avec toutes les tables représentées. Le restaurateur voit en un coup d'œil quelles tables sont libres, en commande ou demandent l'addition.

### Impact
Remplacement de la vue liste des commandes par une vue spatiale plus intuitive.

### Pistes d'implémentation
- Page `/dashboard/salle` avec grille de tables configurables
- Couleurs : vert (libre), orange (commande en cours), rouge (demande l'addition)
- Clic sur une table → détail de la commande en cours
- Mise à jour temps réel via SSE (même endpoint que Feature 1)
