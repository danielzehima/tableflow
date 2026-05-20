-- ================================================================
-- MIGRATION: Articles du blog
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  excerpt      TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'Article',
  cover_emoji  TEXT NOT NULL DEFAULT '📝',
  author       TEXT NOT NULL DEFAULT 'Équipe TableFlow',
  published    BOOLEAN NOT NULL DEFAULT false,
  reading_time INTEGER NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles(published, created_at DESC);

-- Seed : 3 articles d'exemple (non publiés)
INSERT INTO articles (title, slug, excerpt, content, category, cover_emoji, author, published, reading_time) VALUES
(
  '5 façons d''augmenter vos réservations en ligne',
  '5-facons-augmenter-reservations-en-ligne',
  'Découvrez les stratégies éprouvées pour remplir votre salle chaque soir grâce à votre présence digitale.',
  'Avoir un restaurant vide est le cauchemar de tout restaurateur. Pourtant, avec les bons outils digitaux, il est possible de transformer radicalement votre taux d''occupation.

## 1. Optimisez votre page publique

Votre page TableFlow est votre vitrine 24h/24. Assurez-vous que les photos de vos plats soient de qualité et que votre menu soit complet et à jour. Un client qui trouve facilement ce qu''il cherche est un client qui réserve.

## 2. Activez les notifications de rappel

Les no-shows représentent en moyenne 15 % des réservations. En activant les rappels automatiques par SMS la veille de la réservation, vous réduisez ce chiffre de moitié.

## 3. Répondez rapidement aux demandes

Le temps de réponse moyen attendu par un client en ligne est inférieur à 2 heures. Avec l''application TableFlow, vous recevez des notifications instantanées dès qu''une réservation est effectuée.

## 4. Mettez en avant vos événements spéciaux

Soirées à thème, menus saisonniers, concerts... publiez vos événements sur votre page publique. Ces occasions spéciales génèrent jusqu''à 40 % de réservations supplémentaires.

## 5. Encouragez les avis clients

Un restaurant avec des avis visibles reçoit 3 fois plus de réservations qu''un restaurant sans avis. Demandez à vos clients satisfaits de laisser un commentaire après leur repas.',
  'Conseil', '📈', 'Équipe TableFlow', false, 5
),
(
  'Créer un menu digital qui donne envie',
  'creer-menu-digital-qui-donne-envie',
  'Un menu bien conçu peut augmenter votre panier moyen de 20 %. Voici comment structurer le vôtre.',
  'Le menu est l''âme de votre restaurant. En ligne, il doit être encore plus attractif que sa version papier car il est souvent le premier contact du client avec votre établissement.

## L''importance des descriptions

Une description bien rédigée ne liste pas les ingrédients — elle raconte une histoire. Au lieu de "Poulet yassa, oignon, citron", essayez "Poulet yassa mariné 24h, confit d''oignon caramélisé et citron confit, servi avec du riz parfumé".

## Organisez par catégories claires

Entrées, plats, accompagnements, desserts, boissons. Vos clients doivent pouvoir naviguer en moins de 3 secondes. Évitez les catégories trop nombreuses ou les noms trop créatifs qui perdent le lecteur.

## Les photos font vendre

Un plat avec photo se vend 30 % plus souvent qu''un plat sans photo. Investissez dans quelques belles photos professionnelles de vos plats phares. La lumière naturelle est votre meilleure alliée.

## Mettez en avant vos spécialités

Utilisez les badges "Coup de cœur", "Nouveau" ou "Populaire" pour guider le choix de vos clients. Ces éléments visuels augmentent le panier moyen de façon mesurable.

## Prix et transparence

Affichez toujours les prix clairement. Un client surpris par un prix au moment de l''addition ne revient pas. La transparence construit la confiance.',
  'Guide', '🍽️', 'Équipe TableFlow', false, 6
),
(
  'TableFlow lance les notifications en temps réel',
  'tableflow-notifications-temps-reel',
  'Vos équipes reçoivent désormais des alertes instantanées pour chaque nouvelle commande ou réservation.',
  'Nous sommes fiers d''annoncer le lancement des notifications en temps réel pour tous les utilisateurs de TableFlow.

## Ce qui change

À partir d''aujourd''hui, chaque fois qu''un client passe une commande ou effectue une réservation sur votre page publique, toute votre équipe reçoit une notification instantanée directement dans l''application.

## Comment ça fonctionne

Les notifications sont poussées automatiquement sur l''appareil de chaque membre de votre équipe connecté. Pas besoin de rafraîchir la page ou de vérifier manuellement — vous êtes alertés en temps réel.

## Disponible sur tous les appareils

Que vous utilisiez TableFlow sur ordinateur, tablette ou smartphone, les notifications fonctionnent partout. Votre équipe reste synchronisée même en salle.

## Comment activer

Les notifications en temps réel sont activées par défaut pour tous les comptes. Rendez-vous dans vos Paramètres pour personnaliser les types d''alertes que vous souhaitez recevoir.',
  'Nouveauté', '🔔', 'Équipe TableFlow', false, 3
)
ON CONFLICT (slug) DO NOTHING;
