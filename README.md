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

Cette commande crée la base configurée par `SQL_DBNAME`, ainsi que les tables
`users` et `rooms`. Le schéma SQL est aussi disponible dans
`database/schema.sql`.

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
