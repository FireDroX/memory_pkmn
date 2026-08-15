# PokeFlip

PokeFlip est un jeu de memory Pokemon jouable en solo ou jusqu'a quatre joueurs.
Le mode multijoueur synchronise les cartes, les tours et les scores en temps reel
avec Socket.IO.

## Stack

- React 19 et Vite 7
- Express et Socket.IO
- MySQL avec `mysql2`
- PokeAPI pour les sprites

## Installation

Prérequis : Node.js 22.22+ et MySQL 8+ ou MariaDB.

```bash
npm install
npm --prefix client install
```

Copier `.env.example` vers `.env`, puis adapter les identifiants MySQL si besoin.

```bash
npm run db:setup
```

Cette commande crée la base configurée par `SQL_DBNAME`, puis applique toutes
les migrations SQL qui ne l'ont pas encore été. L'utilisateur MySQL configuré
doit avoir le droit de créer la base et ses tables.

## Migrations de la base de données

Les migrations sont exécutées dans l'ordre de leur nom depuis
`database/migrations` :

- `001_create_users.sql` crée la table `users` ;
- `002_create_rooms.sql` crée la table `rooms`.

La table `schema_migrations` enregistre automatiquement les fichiers déjà
appliqués et leur empreinte. La commande peut donc être relancée sans recréer
les tables ni perdre leurs données :

```bash
npm run db:migrate
```

Pour faire évoluer le schéma, ajouter un nouveau fichier avec le numéro suivant,
par exemple `003_add_user_email.sql`, puis relancer `npm run db:migrate`. Une
migration déjà appliquée ne doit pas être modifiée : il faut en créer une nouvelle.

## Développement

Lancer le serveur API et Socket.IO :

```bash
npm run dev
```

Puis lancer Vite dans un second terminal :

```bash
npm run client
```

- Frontend : http://localhost:5173
- API et Socket.IO : http://localhost:3000

Vite relaie automatiquement `/api` et `/socket.io` vers le backend.

## Production

```bash
npm run build
npm start
```

Express sert alors le build généré dans `client/dist`.
