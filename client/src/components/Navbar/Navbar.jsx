import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../utils/UserContext";
import "./Navbar.css";
import "../../utils/CustomColors.css";

const Navbar = () => {
  const { name, isLoggedIn, userProfile } = useContext(UserContext);
  const navigate = useNavigate();

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  const xpPercentage = (userProfile.xp / userProfile.xpNeeded) * 100;

  return (
    <div className="navbar-container">
      <div className="navbar-texts">
        <p onClick={() => navigate("")}>Home</p>
        {name !== "" && isLoggedIn ? (
          <>
            <div className="progress-container">
              LEVEL {userProfile.level}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${xpPercentage >= 100 ? 100 : xpPercentage}%`,
                  }}
                ></div>
              </div>
              {userProfile.xp} / {userProfile.xpNeeded}
            </div>
            <p>
              Welcome{" "}
              <strong
                className={userProfile.inventory[0].colors[0]}
                data-name={name}
                onClick={() => navigate("?query=profile")}
              >
                {name}
              </strong>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                  name
                )}.png`}
                style={{ height: "25px", width: "25px" }}
                alt=""
              />
            </p>
          </>
        ) : (
          <p
            style={{ textDecoration: "underline 1px solid var(--text85)" }}
            onClick={() => navigate("?query=login")}
          >
            Login
          </p>
        )}
      </div>
    </div>
  );
};

export default Navbar;
