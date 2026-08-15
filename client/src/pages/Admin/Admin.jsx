import { useContext, useEffect, useMemo, useState } from "react";
import {
  FaClone,
  FaGamepad,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import StatusPopup, {
  useStatusPopup,
} from "../../components/StatusPopup/StatusPopup";
import { UserContext } from "../../utils/UserContext";
import { localizedStatus } from "../../utils/serverStatus";
import "./Admin.css";

const emptyDashboard = {
  stats: {
    totalUsers: 0,
    totalAdmins: 0,
    onlineGamesPlayed: 0,
    onlineGamesWon: 0,
    soloGamesPlayed: 0,
    soloGamesWon: 0,
    totalPairsFound: 0,
    shinyPairsFound: 0,
  },
  users: [],
};

const pokemonFromName = (name) => {
  const total = [...name].reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );
  return ((total - 1) % 1025) + 1;
};

const Admin = () => {
  const { name, setRole } = useContext(UserContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { status, statusId, setStatus, clearStatus } = useStatusPopup();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/admin", {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 403) {
            setRole("user");
            navigate("/", { replace: true });
          }
          setStatus(data.status || localizedStatus("status.adminLoad"));
          return;
        }
        setDashboard(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus(localizedStatus("status.adminLoad"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [navigate, setRole, setStatus]);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return dashboard.users;
    return dashboard.users.filter((user) =>
      user.name.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [dashboard.users, search]);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.resolvedLanguage),
    [i18n.resolvedLanguage],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [i18n.resolvedLanguage],
  );

  const statCards = [
    { key: "totalUsers", icon: FaUsers, tone: "blue" },
    { key: "totalAdmins", icon: FaShieldAlt, tone: "red" },
    { key: "onlineGamesPlayed", icon: FaGamepad, tone: "yellow" },
    { key: "soloGamesPlayed", icon: FaGamepad, tone: "green" },
    { key: "totalPairsFound", icon: FaClone, tone: "purple" },
    { key: "shinyPairsFound", icon: FaStar, tone: "gold" },
  ];

  const updateRole = async (user, nextRole) => {
    if (nextRole === user.role) return;
    setSavingUserId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.status || localizedStatus("status.adminRoleUpdate"));
        return;
      }

      setDashboard((current) => ({
        stats: {
          ...current.stats,
          totalAdmins:
            current.stats.totalAdmins + (nextRole === "admin" ? 1 : -1),
        },
        users: current.users.map((entry) =>
          entry.id === user.id ? { ...entry, role: nextRole } : entry,
        ),
      }));
      setStatus(
        localizedStatus("status.adminRoleUpdated", { name: user.name }),
      );

      if (user.name === name && nextRole !== "admin") {
        setRole("user");
        navigate("/", { replace: true });
      }
    } catch {
      setStatus(localizedStatus("status.adminRoleUpdate"));
    } finally {
      setSavingUserId("");
    }
  };

  return (
    <section className="App admin-page">
      <div>
        <main className="admin-shell">
          <header className="admin-hero">
            <div>
              <span className="eyebrow">{t("admin.eyebrow")}</span>
              <h1>{t("admin.title")}</h1>
              <p>{t("admin.description")}</p>
            </div>
            <FaShieldAlt aria-hidden="true" />
          </header>

          <section
            className="admin-global-stats"
            aria-label={t("admin.globalStats")}
          >
            {statCards.map(({ key, icon: Icon, tone }) => (
              <article className={`admin-stat admin-stat--${tone}`} key={key}>
                <span><Icon aria-hidden="true" /></span>
                <div>
                  <strong>{numberFormatter.format(dashboard.stats[key])}</strong>
                  <small>{t(`admin.stats.${key}`)}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-users-panel">
            <div className="admin-users-heading">
              <div>
                <span className="eyebrow">{t("admin.usersEyebrow")}</span>
                <h2>{t("admin.usersTitle")}</h2>
              </div>
              <label className="admin-search">
                <FaSearch aria-hidden="true" />
                <span className="sr-only">{t("admin.search")}</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("admin.search")}
                />
              </label>
            </div>

            {loading ? (
              <p className="admin-empty">{t("admin.loading")}</p>
            ) : visibleUsers.length === 0 ? (
              <p className="admin-empty">{t("admin.noUsers")}</p>
            ) : (
              <div className="admin-user-grid">
                {visibleUsers.map((user) => (
                  <article
                    className={`admin-user-card ${
                      user.role === "admin" ? "is-admin" : ""
                    } ${user.name === name ? "is-current" : ""}`}
                    key={user.id}
                  >
                    <header>
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonFromName(
                          user.name,
                        )}.png`}
                        alt=""
                        draggable={false}
                      />
                      <div>
                        <strong>{user.name}</strong>
                        <small>
                          {user.name === name
                            ? t("admin.currentUser")
                            : t("admin.memberSince", {
                                date: dateFormatter.format(
                                  new Date(user.createdAt),
                                ),
                              })}
                        </small>
                      </div>
                      <span className={`admin-role admin-role--${user.role}`}>
                        {t(`admin.roles.${user.role}`)}
                      </span>
                    </header>

                    <dl className="admin-user-stats">
                      <div><dt>{t("admin.level")}</dt><dd>{user.level}</dd></div>
                      <div>
                        <dt>{t("admin.onlineRecord")}</dt>
                        <dd>{user.onlineGamesWon}/{user.onlineGamesPlayed}</dd>
                      </div>
                      <div>
                        <dt>{t("admin.soloRecord")}</dt>
                        <dd>{user.soloGamesWon}/{user.soloGamesPlayed}</dd>
                      </div>
                      <div>
                        <dt>{t("admin.pairs")}</dt>
                        <dd>{numberFormatter.format(user.totalPairsFound)}</dd>
                      </div>
                    </dl>

                    <label className="admin-role-control">
                      <span>{t("admin.role")}</span>
                      <select
                        value={user.role}
                        disabled={savingUserId === user.id}
                        onChange={(event) => updateRole(user, event.target.value)}
                        aria-label={t("admin.changeRole", { name: user.name })}
                      >
                        <option value="user">{t("admin.roles.user")}</option>
                        <option value="admin">{t("admin.roles.admin")}</option>
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      <StatusPopup
        status={status}
        statusId={statusId}
        clearStatus={clearStatus}
      />
    </section>
  );
};

export default Admin;
