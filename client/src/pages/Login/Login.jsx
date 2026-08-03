import "./Login.css";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../../utils/UserContext";

function Login({ connect }) {
  const { setName, setIsLoggedIn, setUserProfile, setUserStats } =
    useContext(UserContext);
  const navigate = useNavigate();
  const [inputName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState();

  const handlePost = async (postLink) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inputName, password: password }),
    };

    if (inputName === "" || password === "")
      setStatus("Tous les champs sont requis.");
    else {
      if (postLink === "/api/register") {
        if (password !== confirmPassword)
          return setStatus("Les mots de passe doivent etre identiques.");
      }
      const data = await fetch(postLink, requestOptions);
      const json = await data.json();

      setStatus(json?.status);
      if (json?.status === "" && postLink === "/api/login") {
        setName(inputName);
        setIsLoggedIn(true);
        setUserProfile(json.profile);
        setUserStats({
          onlineGamesWon: json.online_games_won,
          shinyPairsFound: json.shiny_pairs_found,
          createdAt: json.created_at,
        });
        navigate("/profile");
      }
    }
    setPassword("");
    setConfirmPassword("");
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow letters and numbers
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, "");
    setUsername(filteredValue);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handlePost(connect ? "/api/login" : "/api/register");
      }
    };

    // Attach event listener for keydown
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [connect, inputName, password, confirmPassword]);

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  return (
    <section className="App">
      <div>
        <div className="login-container">
          <div className="login-container-data">
            <span className="eyebrow">{connect ? "BON RETOUR" : "NOUVEAU DRESSEUR"}</span>
            <h2>{connect ? "PRET A REJOUER ?" : "REJOINS L'ARENE."}</h2>
            <p>
              {connect
                ? "Connecte-toi pour retrouver ta progression et defier tes amis."
                : "Cree ton profil, invite tes amis et grimpe dans le classement."}
            </p>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                inputName,
              )}.png`}
              alt="User"
              draggable={false}
            />
            {status ? <p className="login-status">{status}</p> : false}
          </div>
          {connect ? (
            <div className="login-container-inputs">
              <div className="login-inputs">
                <label htmlFor="login-name">Ton pseudo</label>
                <input
                  id="login-name"
                  type="text"
                  name="name"
                  value={inputName}
                  onChange={handleInputChange}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-inputs">
                <label htmlFor="login-password">Ton mot de passe</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-buttons">
                <button onClick={() => handlePost("/api/login")}>Se connecter</button>
                <small
                  className="login-change-pages"
                  onClick={() => navigate("/login/register")}
                >
                  Creer un compte
                </small>
              </div>
              <p className="login-privacy">
                Tes données de compte sont traitées selon notre{" "}
                <a href="/api/mentions-legales" target="_blank" rel="noreferrer">
                  notice de confidentialité
                </a>.
              </p>
            </div>
          ) : (
            <div className="login-container-inputs">
              <div className="login-inputs">
                <label htmlFor="register-name">Ton pseudo</label>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  value={inputName}
                  onChange={handleInputChange}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-inputs">
                <label htmlFor="register-password">Ton mot de passe</label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-inputs">
                <label htmlFor="register-confirm">Confirme le mot de passe</label>
                <input
                  id="register-confirm"
                  type="password"
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-buttons">
                <small
                  className="login-change-pages"
                  onClick={() => navigate("/login")}
                >
                  J'ai deja un compte
                </small>
                <button onClick={() => handlePost("/api/register")}>
                  S'inscrire
                </button>
              </div>
              <p className="login-privacy">
                En créant un compte, tu peux consulter les finalités et tes droits
                dans notre{" "}
                <a href="/api/mentions-legales" target="_blank" rel="noreferrer">
                  notice de confidentialité
                </a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Login;
