import { useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { FaShieldAlt, FaTrophy } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../utils/UserContext";
import { getLanguage } from "../../utils/languages";
import { pokemonIdFromName } from "../../utils/pokemon";
import frenchFlag from "../../assets/flags/fr.svg";
import britishFlag from "../../assets/flags/gb.svg";
import "./Navbar.css";
import "../../utils/CustomColors.css";

const languageFlags = Object.freeze({
  en: britishFlag,
  fr: frenchFlag,
});

const Navbar = () => {
  const { name, isLoggedIn, role, userProfile } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const language = getLanguage(i18n.resolvedLanguage);

  const xpPercentage = (userProfile.xp / userProfile.xpNeeded) * 100;

  return (
    <header className="navbar-container">
      <div className="navbar-texts">
        <button
          className="brand"
          onClick={() => navigate("/")}
          aria-label={t("nav.home")}
        >
          <span className="brand-ball" aria-hidden="true" />
          <span>
            <strong>POKE</strong>FLIP
          </span>
        </button>
        <nav className="nav-links" aria-label={t("nav.main")}>
          <button
            className={location.pathname === "/" ? "active" : ""}
            onClick={() => navigate("/")}
          >
            {t("nav.solo")}
          </button>
          {isLoggedIn && (
            <>
              <button
                className={location.pathname === "/profile" ? "active" : ""}
                onClick={() => navigate("/profile")}
              >
                {t("nav.rooms")}
              </button>
              <button
                aria-label={t("nav.leaderboard")}
                className={
                  location.pathname === "/profile/leaderboard" ? "active" : ""
                }
                onClick={() => navigate("/profile/leaderboard")}
              >
                <FaTrophy />
                <span>{t("nav.leaderboard")}</span>
              </button>
              {role === "admin" && (
                <button
                  aria-label={t("nav.admin")}
                  className={location.pathname === "/admin" ? "active" : ""}
                  onClick={() => navigate("/admin")}
                >
                  <FaShieldAlt />
                  <span>{t("nav.admin")}</span>
                </button>
              )}
            </>
          )}
        </nav>
        <div className="navbar-actions">
          <button
            type="button"
            className="language-switch"
            onClick={() => i18n.changeLanguage(language.alternate)}
            aria-label={t(language.switchKey)}
            title={t(language.switchKey)}
          >
            <img
              src={languageFlags[language.alternate]}
              alt=""
              aria-hidden="true"
            />
          </button>
          {name !== "" && isLoggedIn ? (
            <button className="user-chip" onClick={() => navigate("/profile")}>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIdFromName(
                name,
              )}.png`}
              alt=""
            />
            <span className="user-chip-copy">
              <span
                className={userProfile.inventory[0].colors[0]}
                data-name={name}
              >
                {name}
              </span>
              <span className="progress-container">
                {t("nav.level", { level: userProfile.level })}
                <span className="progress-bar">
                  <span
                    className="progress-fill"
                    style={{
                      width: `${xpPercentage >= 100 ? 100 : xpPercentage}%`,
                    }}
                  />
                </span>
              </span>
            </span>
            </button>
          ) : (
            <button className="nav-login" onClick={() => navigate("/login")}>
              {t("nav.login")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
