import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../utils/UserContext";
import "./Navbar.css";

const Navbar = () => {
  const { name, isLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  return (
    <div className="navbar-container">
      <div className="navbar-texts">
        {name !== "" && isLoggedIn ? (
          <p>
            Welcome{" "}
            <strong onClick={() => navigate("?query=profile")}>{name}</strong>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                name
              )}.png`}
              style={{ height: "25px", width: "25px" }}
              alt=""
            />
          </p>
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
