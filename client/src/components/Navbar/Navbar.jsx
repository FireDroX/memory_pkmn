import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaTrophy } from "react-icons/fa";
import { UserContext } from "../../utils/UserContext";
import "./Navbar.css";
import "../../utils/CustomColors.css";

const Navbar = () => {
  const { name, isLoggedIn, userProfile } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  const xpPercentage = (userProfile.xp / userProfile.xpNeeded) * 100;

  return (
    <header className="navbar-container">
      <div className="navbar-texts">
        <button
          className="brand"
          onClick={() => navigate("/")}
          aria-label="Accueil"
        >
          <span className="brand-ball" aria-hidden="true" />
          <span>
            <strong>POKE</strong>FLIP
          </span>
        </button>
        <nav className="nav-links" aria-label="Navigation principale">
          <button
            className={location.pathname === "/" ? "active" : ""}
            onClick={() => navigate("/")}
          >
            Solo
          </button>
          {isLoggedIn && (
            <>
              <button
                className={location.pathname === "/profile" ? "active" : ""}
                onClick={() => navigate("/profile")}
              >
                Salons
              </button>
              <button
                aria-label="Classement"
                className={
                  location.pathname === "/profile/leaderboard" ? "active" : ""
                }
                onClick={() => navigate("/profile/leaderboard")}
              >
                <FaTrophy />
                <span>Classement</span>
              </button>
            </>
          )}
        </nav>
        {name !== "" && isLoggedIn ? (
          <button className="user-chip" onClick={() => navigate("/profile")}>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
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
                Niv. {userProfile.level}
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
            Connexion
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
