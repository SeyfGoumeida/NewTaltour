# NewTaltour

Refonte de [taltour.com](https://taltour.com) (location de voitures en Algérie, et au Maroc avec Ouziad Marrakech Cars) : mêmes fonctionnalités, mêmes données et mêmes textes en français, avec un nouveau design sombre.

- **Frontend** : Next.js 14 (App Router), Tailwind, `packages/frontend`
- **API** : Express + PostgreSQL, `packages/backend`
- **Base de données** : schéma `packages/database/schema.sql`, données taltour.com dans `packages/database/data/`

## Démarrage local

Prérequis : Node 18+ et Docker.

```bash
npm install
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env.local
docker compose up -d postgres
npm run seed        # recrée le schéma et charge toutes les données
npm run dev         # API sur :3001, site sur :3000
```

- Site : <http://localhost:3000>
- Back-office : <http://localhost:3000/admin>
- API : <http://localhost:3001/api/health>

`npm run seed` peut être relancé à tout moment pour revenir à l'état de démo.

## Comptes de démo

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@taltour.com` | `Admin2026!` |
| Client démo (réservations dans tous les états, avoir, fidélité) | `client@taltour.com` | `Client2026!` |
| Autres clients (90 comptes `@example.com`) | voir la table `contacts` | `Taltour2026!` |

Codes promo de démo : `BIENVENUE10`, `TALTOUR2026`, `FIDELE15` (actifs), `ETE2025`, `AID2026` (expirés), `PARTENAIRE20` (désactivé).

## Données

Données réelles de taltour.com :

- 43 modèles Algérie et 9 modèles Maroc avec fiches techniques, photos, cautions et tarifs basse saison 1/7/14/30/90/180 jours ;
- les 12 villes et Marrakech ;
- les options, conditions de location, FAQ, pages, articles du blog ;
- 671 avis clients.

Données d'exemple générées par le seed :

- environ 150 véhicules immatriculés répartis par ville ;
- 90 clients et environ 440 réservations passées, en cours et à venir ;
- paiements, avoirs, messages de contact, demandes de transfert.

Les noms d'agents et numéros d'agents par ville ainsi que l'IBAN sont des valeurs d'exemple, à remplacer dans le back-office (Villes & agences, Paramètres).

## Règles de tarification (identiques à taltour.com)

- **Forfaits dégressifs** : le prix par jour du plus grand forfait atteint (1, 7, 14, 30, 90, 180 jours), 1 h de tolérance.
- **Saisons** : coefficient par jour (haute saison +30 %, modifiable dans Saisons).
- **Remise véhicule** : -10 % véhicule de 2 ans, -15 % de 3 ans.
- **Frais** : aller simple 70 € quand la ville de retour est différente ; frais de rapatriement au km quand le véhicule est stationné dans une autre ville, avec le message « louez moi à … ».
- **Options** : fixes, par jour ou en % de la location ; Assurance Gold sans caution, avec 30 € de réserve.
- **Conducteur** : 25 ans ou plus de 5 ans de permis, 2 ans de permis minimum ; plus de 110 ch : 30 ans et 5 ans de permis. Moins de 5 ans de permis ou plus de 65 ans : caution doublée et Gold indisponible.
- **Fidélité** : -10 % après une location terminée. Codes promo, avoirs utilisables au paiement.
- **Annulation** : 20 % retenus à plus de 48 h, 30 % dans les 48 h, ou avoir intégral ; remboursement total avec l'assurance annulation.
- **Paiement** : CB, PayPal, chèque, virement, ou en deux fois (acompte PayPal + solde en espèces). Le paiement en ligne est simulé en local.

Tous les paramètres sont modifiables dans `/admin/parametres`.

## Sécurité et mise en production

En dehors de `NODE_ENV=development`, l'API applique automatiquement :

- refus de démarrer sans `JWT_SECRET` d'au moins 32 caractères (`openssl rand -hex 32`) ou avec un `FRONTEND_URL` en http ;
- seed de démo bloqué (il efface la base) ;
- lien de réinitialisation du mot de passe jamais renvoyé par l'API ;
- paiements CB / PayPal / en deux fois désactivés tant qu'un prestataire de paiement n'est pas branché (`SIMULATED_PAYMENTS` ne doit jamais valoir `true` en production) ;
- cookie de session `Secure` et en-tête HSTS.

Protections actives dans tous les cas :

- session dans un cookie `HttpOnly; SameSite=Lax` (aucun jeton lisible par JavaScript), invalidée au changement de mot de passe ;
- en-tête `x-requested-with` obligatoire sur les requêtes qui modifient des données (protection CSRF) ;
- limitation des tentatives (connexion, inscription, mot de passe oublié, réservations, formulaires) et champs pièges anti-robots ;
- Content-Security-Policy avec nonce, anti-iframe, `nosniff` sur le site (`src/proxy.ts`, `next.config.js`) et via helmet sur l'API ;
- jetons de réinitialisation à usage unique, valables 1 h, stockés hachés ;
- PostgreSQL et Redis accessibles uniquement depuis la machine locale (`docker-compose.yml`).

Variables à renseigner : voir `packages/backend/.env.example` (`JWT_SECRET`, `FRONTEND_URL`, `COOKIE_DOMAIN`, `TRUST_PROXY`). Les comptes de démo ne doivent jamais exister en production.

Reste à faire avant d'encaisser en ligne : brancher un prestataire de paiement (Paybox, PayPal, Stripe…) avec validation côté serveur, et ajouter une double authentification pour les administrateurs.

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | API et site en mode développement |
| `npm run seed` | recrée la base de démo |
| `npm run type-check` | vérification TypeScript des deux paquets |
| `npm run build` | build de production |
