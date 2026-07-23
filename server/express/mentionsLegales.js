const express = require("express");

const router = express.Router();

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const legalSetting = (key, fallback) =>
  escapeHtml(process.env[key]?.trim() || fallback);

router.get("/", (_, res) => {
  const editor = legalSetting("LEGAL_EDITOR_NAME", "Adrien POURLIER");
  const contact = legalSetting("LEGAL_CONTACT_EMAIL", "contact@addrien.fr");
  const publicationDirector = legalSetting(
    "LEGAL_PUBLICATION_DIRECTOR",
    "Adrien POURLIER",
  );
  const updatedAt = legalSetting(
    "LEGAL_NOTICE_UPDATED_AT",
    "23 juillet 2026",
  );

  res.type("html").send(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Mentions légales et politique de confidentialité de PokeFlip."
        />
        <meta name="robots" content="noindex, follow" />
        <meta name="theme-color" content="#14213d" />
        <title>Mentions légales et confidentialité — PokeFlip</title>
        <style>
          :root {
            color-scheme: light;
            --ink: #14213d;
            --ink-soft: #58647a;
            --paper: #fffdf7;
            --background: #f3efe4;
            --line: #d9d3c5;
            --yellow: #ffd64a;
            --red: #ef5b5b;
            --blue: #4d7cff;
          }

          * { box-sizing: border-box; }

          html { scroll-behavior: smooth; }

          body {
            margin: 0;
            color: var(--ink);
            background:
              radial-gradient(circle at 7% 3%, rgba(255, 214, 74, .28), transparent 24rem),
              radial-gradient(circle at 95% 25%, rgba(77, 124, 255, .12), transparent 28rem),
              var(--background);
            font: 16px/1.7 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          a {
            color: #294fbd;
            text-decoration-thickness: 1px;
            text-underline-offset: .2em;
          }

          a:hover { color: var(--red); }

          .legal-page {
            width: min(1080px, calc(100% - 32px));
            margin: 0 auto;
            padding: 42px 0 72px;
          }

          .legal-header {
            position: relative;
            overflow: hidden;
            padding: clamp(34px, 7vw, 72px);
            border: 1px solid var(--line);
            border-radius: 28px;
            background: var(--ink);
            color: white;
            box-shadow: 0 24px 60px rgba(20, 33, 61, .13);
          }

          .legal-header::after {
            position: absolute;
            right: -65px;
            bottom: -105px;
            width: 285px;
            aspect-ratio: 1;
            border: 48px solid rgba(255, 214, 74, .18);
            border-radius: 50%;
            content: "";
          }

          .legal-header small,
          .legal-section-title small {
            color: var(--red);
            font-size: .7rem;
            font-weight: 900;
            letter-spacing: .12em;
            text-transform: uppercase;
          }

          .legal-header small { color: var(--yellow); }

          h1, h2 { line-height: 1.08; }

          h1 {
            position: relative;
            z-index: 1;
            max-width: 720px;
            margin: 18px 0 15px;
            font-size: clamp(2.3rem, 7vw, 5.2rem);
            letter-spacing: -.05em;
          }

          .legal-header p {
            position: relative;
            z-index: 1;
            max-width: 670px;
            margin: 0;
            color: rgba(255, 255, 255, .68);
          }

          .legal-header time {
            position: relative;
            z-index: 1;
            display: block;
            margin-top: 24px;
            color: rgba(255, 255, 255, .48);
            font-size: .72rem;
            font-weight: 800;
          }

          .legal-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 22px 0;
          }

          .legal-nav a {
            padding: 8px 11px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: rgba(255, 255, 255, .62);
            color: var(--ink);
            font-size: .74rem;
            font-weight: 850;
            text-decoration: none;
          }

          .legal-content {
            overflow: hidden;
            border: 1px solid var(--line);
            border-radius: 24px;
            background: var(--paper);
          }

          .legal-section {
            display: grid;
            grid-template-columns: minmax(190px, .7fr) minmax(0, 1.7fr);
            gap: clamp(24px, 6vw, 72px);
            padding: clamp(28px, 6vw, 58px);
            scroll-margin-top: 20px;
          }

          .legal-section + .legal-section {
            border-top: 1px solid var(--line);
          }

          .legal-section-title h2 {
            margin: 8px 0 0;
            font-size: clamp(1.35rem, 3vw, 1.85rem);
            letter-spacing: -.035em;
          }

          .legal-section-body > :first-child { margin-top: 0; }
          .legal-section-body > :last-child { margin-bottom: 0; }
          .legal-section-body p,
          .legal-section-body li { color: var(--ink-soft); }

          .legal-details {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin: 22px 0 0;
          }

          .legal-details div {
            min-width: 0;
            padding: 14px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: #f8f5ed;
          }

          .legal-details dt {
            margin-bottom: 3px;
            font-size: .67rem;
            font-weight: 900;
            letter-spacing: .07em;
            text-transform: uppercase;
          }

          .legal-details dd {
            margin: 0;
            overflow-wrap: anywhere;
            color: var(--ink-soft);
          }

          .legal-note {
            margin-top: 22px;
            padding: 15px 17px;
            border-left: 4px solid var(--yellow);
            border-radius: 0 12px 12px 0;
            background: #fff7d6;
            color: var(--ink);
            font-style: normal;
          }

          .legal-list {
            margin: 18px 0;
            padding-left: 20px;
          }

          .legal-list li + li { margin-top: 7px; }

          .legal-references {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 22px;
          }

          .legal-references a {
            padding: 8px 11px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: #f8f5ed;
            font-size: .72rem;
            font-weight: 800;
            text-decoration: none;
          }

          .legal-back {
            display: flex;
            justify-content: center;
            padding-top: 28px;
          }

          .legal-back a {
            color: var(--ink-soft);
            font-size: .75rem;
            font-weight: 800;
          }

          @media (max-width: 720px) {
            .legal-page {
              width: min(100% - 20px, 1080px);
              padding-top: 10px;
            }

            .legal-header,
            .legal-content { border-radius: 18px; }

            .legal-section {
              grid-template-columns: 1fr;
              gap: 18px;
            }

            .legal-details { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <main class="legal-page">
          <header class="legal-header">
            <small>mentions &amp; confidentialité</small>
            <h1>Informations légales</h1>
            <p>
              Informations relatives à l’édition de PokeFlip, à son hébergement,
              aux données utilisées pour son fonctionnement et aux ressources Pokémon.
            </p>
            <time datetime="2026-07-23">Mise à jour le ${updatedAt}</time>
          </header>

          <nav class="legal-nav" aria-label="Sommaire des mentions légales">
            <a href="#edition">Édition</a>
            <a href="#hebergement">Hébergement</a>
            <a href="#confidentialite">Confidentialité</a>
            <a href="#services">Services externes</a>
            <a href="#propriete">Propriété intellectuelle</a>
            <a href="#droits">Vos droits</a>
          </nav>

          <div class="legal-content">
            <section class="legal-section" id="edition">
              <div class="legal-section-title">
                <small>identification</small>
                <h2>Édition du site</h2>
              </div>
              <div class="legal-section-body">
                <p>
                  PokeFlip est édité à titre personnel et non professionnel par
                  ${editor}. Le projet est un jeu de mémoire solo et multijoueur
                  développé à des fins personnelles et éducatives.
                </p>
                <dl class="legal-details">
                  <div>
                    <dt>Éditeur</dt>
                    <dd>${editor}</dd>
                  </div>
                  <div>
                    <dt>Directeur de publication</dt>
                    <dd>${publicationDirector}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd><a href="mailto:${contact}">${contact}</a></dd>
                  </div>
                  <div>
                    <dt>Site concerné</dt>
                    <dd>PokeFlip</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section class="legal-section" id="hebergement">
              <div class="legal-section-title">
                <small>infrastructure</small>
                <h2>Hébergement</h2>
              </div>
              <div class="legal-section-body">
                <p>
                  PokeFlip, son API et sa base de données sont hébergés en France
                  sur une infrastructure personnelle administrée par l’éditeur.
                  Docker assure l’exécution des services et Cloudflare Tunnel leur
                  mise à disposition sécurisée sur Internet.
                </p>
                <p>
                  La disponibilité, la maintenance et la sauvegarde de cette
                  infrastructure relèvent directement de l’éditeur.
                </p>
              </div>
            </section>

            <section class="legal-section" id="confidentialite">
              <div class="legal-section-title">
                <small>données</small>
                <h2>Confidentialité</h2>
              </div>
              <div class="legal-section-body">
                <p>
                  La création d’un compte nécessite un pseudo et un mot de passe.
                  Le mot de passe est enregistré uniquement sous forme hachée côté
                  serveur. Sont également conservés la date de création du compte,
                  la progression, les succès, les couleurs débloquées ainsi que les
                  statistiques nécessaires au jeu et aux classements.
                </p>
                <p>
                  Les données relatives aux salons multijoueurs sont utilisées pour
                  organiser les parties en temps réel. Elles peuvent inclure les
                  pseudos des joueurs, l’état des cartes et la progression de la partie.
                </p>
                <p>
                  Ces informations sont traitées afin de fournir le service demandé.
                  Elles ne sont ni vendues, ni utilisées pour établir un profil
                  publicitaire. PokeFlip n’intègre aucun outil de mesure d’audience
                  publicitaire.
                </p>
                <p>
                  Comme pour tout service web, l’adresse IP, la date de connexion,
                  la ressource demandée ou le type de navigateur peuvent être traités
                  temporairement par le serveur et les intermédiaires réseau pour
                  acheminer les requêtes et assurer la sécurité du service.
                </p>
                <aside class="legal-note">
                  PokeFlip ne conserve plus le mot de passe dans le stockage local
                  du navigateur. Une actualisation de la page peut donc nécessiter
                  une nouvelle connexion.
                </aside>
              </div>
            </section>

            <section class="legal-section" id="services">
              <div class="legal-section-title">
                <small>tiers</small>
                <h2>Services externes</h2>
              </div>
              <div class="legal-section-body">
                <p>Lors de l’utilisation de PokeFlip, le navigateur peut contacter :</p>
                <ul class="legal-list">
                  <li>
                    <strong>Cloudflare</strong>, pour l’accès sécurisé au service ;
                  </li>
                  <li>
                    <strong>PokéAPI</strong>, comme source de données Pokémon ;
                  </li>
                  <li>
                    <strong>GitHub</strong>, pour charger les sprites issus du dépôt
                    public de PokéAPI.
                  </li>
                </ul>
                <p>
                  Ces services disposent de leurs propres conditions d’utilisation
                  et politiques de confidentialité. PokeFlip ne contrôle pas leurs
                  traitements ni leur disponibilité.
                </p>
              </div>
            </section>

            <section class="legal-section" id="propriete">
              <div class="legal-section-title">
                <small>contenus</small>
                <h2>Propriété intellectuelle</h2>
              </div>
              <div class="legal-section-body">
                <p>
                  Sauf indication contraire, le code, les textes et l’interface
                  propres à PokeFlip sont la propriété de leur auteur. Toute
                  reproduction ou réutilisation substantielle nécessite son
                  autorisation préalable.
                </p>
                <p>
                  PokeFlip est un projet de fan indépendant, non officiel, sans
                  affiliation, parrainage ou approbation de Nintendo, Creatures Inc.,
                  GAME FREAK inc., The Pokémon Company ou The Pokémon Company
                  International.
                </p>
                <p>
                  Pokémon, les noms et représentations des personnages, les sprites,
                  la Poké Ball ainsi que les marques et éléments visuels associés
                  appartiennent à leurs titulaires respectifs. Leur présence sert à
                  illustrer ce projet personnel, éducatif et non commercial.
                </p>
                <aside class="legal-note">
                  L’accès aux données et aux sprites par l’intermédiaire de PokéAPI
                  ne transfère aucun droit de propriété intellectuelle sur les
                  contenus Pokémon. Cette mention ne constitue pas une licence
                  accordée par leurs ayants droit.
                </aside>
              </div>
            </section>

            <section class="legal-section" id="responsabilite">
              <div class="legal-section-title">
                <small>utilisation</small>
                <h2>Responsabilité</h2>
              </div>
              <div class="legal-section-body">
                <p>
                  Malgré le soin apporté à PokeFlip, l’éditeur ne peut garantir une
                  disponibilité permanente, l’absence totale d’erreurs ou la
                  conservation indéfinie des parties. Les contenus, liens et services
                  externes ne relèvent pas de sa responsabilité.
                </p>
              </div>
            </section>

            <section class="legal-section" id="droits">
              <div class="legal-section-title">
                <small>contact</small>
                <h2>Vos droits</h2>
              </div>
              <div class="legal-section-body">
                <p>
                  Vous pouvez demander l’accès, la rectification, l’effacement,
                  la limitation ou la portabilité de vos données et, lorsque ce droit
                  s’applique, vous opposer à leur traitement en écrivant à
                  <a href="mailto:${contact}">${contact}</a>.
                </p>
                <p>
                  Cette adresse peut également être utilisée pour toute question
                  relative à un contenu publié ou pour demander son retrait. Une
                  réclamation peut être introduite auprès de la CNIL.
                </p>
                <div class="legal-references">
                  <a
                    href="https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Loi pour la confiance dans l’économie numérique ↗
                  </a>
                  <a
                    href="https://www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vos droits auprès de la CNIL ↗
                  </a>
                  <a
                    href="https://pokeapi.co/docs/v2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Conditions d’utilisation de PokéAPI ↗
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div class="legal-back">
            <a href="/">← Retour à PokeFlip</a>
          </div>
        </main>
      </body>
    </html>
  `);
});

module.exports = router;
