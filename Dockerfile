# ----------- 1. Build du client React -----------
FROM node:20-alpine AS client-build

WORKDIR /app/client

# Installer dépendances client
COPY client/package*.json ./
RUN npm install

# Copier le code et build
COPY client/ ./
RUN npm run build


# ----------- 2. Backend + server -----------
FROM node:20-alpine

WORKDIR /app

# Installer dépendances backend
COPY package*.json ./
RUN npm install

# Copier tout le projet
COPY . .

# Copier le build React dans un dossier public (à adapter selon ton server.js)
COPY --from=client-build /app/client/build ./client/build

# Port (à adapter si besoin)
EXPOSE 3001

# Lancer le serveur
CMD ["node", "server.js"]