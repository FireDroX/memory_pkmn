# PokeFlip

PokeFlip est un jeu de memory Pokemon jouable en solo ou jusqu'a quatre joueurs.
Le mode multijoueur synchronise les cartes, les tours et les scores en temps reel
avec Socket.IO.

## Stack

- React 19 et Vite 7
- Express et Socket.IO
- MySQL avec `mysql2` et sessions Express persistantes
- PokeAPI pour les sprites

## Installation

Prérequis : Node.js 22.22+ et MySQL 8+ ou MariaDB.

```bash
npm install
npm --prefix client install
```

Copier `.env.example` vers `.env`, puis adapter les identifiants MySQL et définir
un `SESSION_SECRET` aléatoire d'au moins 32 caractères.

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
- `002_create_rooms.sql` crée la table `rooms` ;
- `006_create_sessions.sql` crée le stockage persistant des sessions Express ;
- `007_add_user_roles.sql` ajoute les rôles et attribue le rôle administrateur au compte canonique `Admin` existant ;
- `009_create_room_messages.sql` stocke le chat des salons et supprime ses messages en cascade avec leur salon.

La table `schema_migrations` enregistre automatiquement les fichiers déjà
appliqués et leur empreinte. La commande peut donc être relancée sans recréer
les tables ni perdre leurs données :

```bash
npm run db:migrate
```

Pour faire évoluer le schéma, ajouter un nouveau fichier avec le numéro suivant,
par exemple `003_add_user_email.sql`, puis relancer `npm run db:migrate`. Une
migration déjà appliquée ne doit pas être modifiée : il faut en créer une nouvelle.

Sur une base neuve, inscris d'abord le compte qui doit devenir le premier
administrateur, puis exécute une seule fois :

```bash
npm run admin:bootstrap -- MonPseudo
```

La commande est refusée dès qu'un administrateur existe. Les rôles se gèrent
ensuite exclusivement depuis la page d'administration protégée.

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

Le cookie de connexion est `HttpOnly` et ne contient que l'identifiant de
session. L'utilisateur authentifié est stocké côté serveur dans la table
MySQL `sessions`. `SESSION_SECRET` doit être injecté au déploiement et ne doit
jamais être ajouté à l'image Docker ou au dépôt Git.
