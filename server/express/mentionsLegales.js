const express = require("express");
const router = express.Router();

router.get("/", async (_, res) => {
  try {
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <title>Mentions légales - Pokeflip</title>
        </head>
        <body>
          <h1>Mentions légales</h1>

          <h2>1. Site</h2>
          <p><strong>Pokeflip</strong></p>
          <p>
            Site : https://pokeflip.addrien.fr<br/>
            Pokeflip est un jeu en ligne de type memory multijoueur basé sur l'univers Pokémon,
            utilisant l'API PokéAPI.
          </p>

          <h2>2. Éditeur</h2>
          <p>
            Nom : Pokeflip<br/>
            Statut : Projet personnel / éducatif<br/>
            Contact : non défini
          </p>

          <h2>3. Nom de domaine</h2>
          <p>
            Domaine enregistré via IONOS.
          </p>

          <h2>4. Hébergement</h2>
          <p>
            Hébergement local auto-géré.<br/>
            Accès exposé via tunnel AWS (AWS tunneling / reverse proxy).
          </p>

          <h2>5. Propriété intellectuelle</h2>
          <p>
            Les éléments liés à Pokémon sont la propriété de Nintendo, Game Freak et The Pokémon Company.
            Ce projet est non officiel et n’est pas affilié à ces entités.
          </p>

          <h2>6. Données utilisateur</h2>
          <p>
            Le site stocke des informations nécessaires au fonctionnement du jeu
            (compte, progression, statistiques).
          </p>
          <p>
            Des cookies techniques peuvent être utilisés pour la session utilisateur.
          </p>

          <h2>7. Responsabilité</h2>
          <p>
            L’éditeur ne peut être tenu responsable des interruptions de service ou pertes de données.
          </p>

          <h2>8. Contact</h2>
          <p>
            Aucun contact officiel défini pour le moment.
          </p>

        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = router;
