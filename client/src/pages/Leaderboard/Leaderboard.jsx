import { useContext, useEffect, useMemo, useState } from "react";
import { FaBolt, FaCrown, FaMedal, FaStar, FaTrophy } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../utils/UserContext";
import "./Leaderboard.css";

const emptyLeaderboards = {
  levels: [],
  game_wons: [],
  shiny_pairs_found: [],
};

const boardConfigs = [
  {
    key: "levels",
    icon: FaBolt,
    tone: "blue",
    titleKey: "leaderboard.levels",
    scoreKey: "leaderboard.levelScore",
  },
  {
    key: "game_wons",
    icon: FaTrophy,
    tone: "red",
    titleKey: "leaderboard.wins",
    scoreKey: "leaderboard.winsScore",
  },
  {
    key: "shiny_pairs_found",
    icon: FaStar,
    tone: "gold",
    titleKey: "leaderboard.shiny",
    scoreKey: "leaderboard.shinyScore",
  },
];

const Rank = ({ position, rankLabel }) => {
  if (position <= 3) {
    return (
      <span
        className={`leaderboard-rank leaderboard-rank--${position}`}
        aria-label={rankLabel}
      >
        <FaMedal aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="leaderboard-rank" aria-label={rankLabel}>
      {position}
    </span>
  );
};

const LeaderboardCard = ({ config, entries, currentName, formatScore, t }) => {
  const { icon: Icon, key, scoreKey, titleKey, tone } = config;
  const currentIndex = entries.findIndex((entry) => entry.name === currentName);
  const visibleEntries = entries.slice(0, 5).map((entry, index) => ({
    entry,
    position: index + 1,
    personal: false,
  }));

  if (currentIndex >= 5) {
    visibleEntries.push({
      entry: entries[currentIndex],
      position: currentIndex + 1,
      personal: true,
    });
  }

  return (
    <article className={`leaderboard-card leaderboard-card--${tone}`}>
      <header className="leaderboard-card-heading">
        <span className="leaderboard-card-icon">
          <Icon aria-hidden="true" />
        </span>
        <div>
          <span>{t("leaderboard.topFive")}</span>
          <h2>{t(titleKey)}</h2>
        </div>
      </header>

      {visibleEntries.length === 0 ? (
        <p className="leaderboard-empty">{t("leaderboard.empty")}</p>
      ) : (
        <ol className="leaderboard-list">
          {visibleEntries.map(({ entry, position, personal }) => {
            const isCurrent = entry.name === currentName;
            return (
              <li
                className={`${isCurrent ? "is-current" : ""} ${
                  personal ? "is-personal" : ""
                }`}
                key={`${key}-${entry.name}`}
                value={position}
              >
                <Rank
                  position={position}
                  rankLabel={t("leaderboard.rank", { rank: position })}
                />
                <span
                  className={`leaderboard-player ${entry.color}`}
                  data-name={entry.name}
                  title={entry.name}
                >
                  {entry.name}
                </span>
                {isCurrent && (
                  <span className="leaderboard-you">{t("leaderboard.you")}</span>
                )}
                <span className="leaderboard-score">
                  <strong>{formatScore(entry.score)}</strong>
                  <small>{t(scoreKey)}</small>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
};

const Leaderboard = () => {
  const { name } = useContext(UserContext);
  const { t, i18n } = useTranslation();
  const [leaderboards, setLeaderboards] = useState(emptyLeaderboards);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadLeaderboards = async () => {
      try {
        const response = await fetch("/api/profile/leaderboard", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Leaderboard request failed");
        setLeaderboards(await response.json());
      } catch (error) {
        if (error.name !== "AbortError") setLoadFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadLeaderboards();
    return () => controller.abort();
  }, []);

  const formatScore = useMemo(
    () => new Intl.NumberFormat(i18n.resolvedLanguage).format,
    [i18n.resolvedLanguage],
  );

  return (
    <section className="App leaderboard-page">
      <div>
        <main className="leaderboard-shell">
          <header className="leaderboard-hero">
            <div>
              <span className="eyebrow">{t("leaderboard.eyebrow")}</span>
              <h1>{t("leaderboard.title")}</h1>
              <p>{t("leaderboard.description")}</p>
              {!loading && !loadFailed && (
                <span className="leaderboard-trainer-count">
                  {t("leaderboard.activeTrainers", {
                    count: leaderboards.levels.length,
                  })}
                </span>
              )}
            </div>
            <span className="leaderboard-hero-icon">
              <FaCrown aria-hidden="true" />
            </span>
          </header>

          {loading ? (
            <p className="leaderboard-state">{t("leaderboard.loading")}</p>
          ) : loadFailed ? (
            <p className="leaderboard-state is-error">
              {t("leaderboard.loadError")}
            </p>
          ) : (
            <section
              className="leaderboard-grid"
              aria-label={t("leaderboard.title")}
            >
              {boardConfigs.map((config) => (
                <LeaderboardCard
                  config={config}
                  currentName={name}
                  entries={leaderboards[config.key] || []}
                  formatScore={formatScore}
                  key={config.key}
                  t={t}
                />
              ))}
            </section>
          )}
        </main>
      </div>
    </section>
  );
};

export default Leaderboard;
