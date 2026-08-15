import "./Login.css";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../utils/UserContext";
import StatusPopup, {
  useStatusPopup,
} from "../../components/StatusPopup/StatusPopup";
import { localizedStatus } from "../../utils/serverStatus";

function Login({ connect }) {
  const { authenticate } = useContext(UserContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [inputName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { status, statusId, setStatus, clearStatus } = useStatusPopup();

  const handlePost = async (postLink) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name: inputName, password: password }),
    };

    if (inputName === "" || password === "")
      setStatus(localizedStatus("auth.required"));
    else {
      if (postLink === "/api/register") {
        if (password !== confirmPassword)
          return setStatus(localizedStatus("auth.passwordMismatch"));
      }
      const data = await fetch(postLink, requestOptions);
      const json = await data.json();

      setStatus(json?.status || "");
      if (json?.status === "" && postLink === "/api/login") {
        authenticate(json);
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
  }, [connect, inputName, password, confirmPassword, t]);

  const stringToDecimal = (str) => {
    let decimal = 0;
    str.split("").map((char) => (decimal += char.charCodeAt(0)));
    return ((decimal - 1) % 1025) + 1;
  };

  return (
    <section className="App">
      <StatusPopup
        status={status}
        statusId={statusId}
        clearStatus={clearStatus}
      />
      <div>
        <div className="login-container">
          <div className="login-container-data">
            <span className="eyebrow">
              {t(connect ? "auth.welcomeBack" : "auth.newTrainer")}
            </span>
            <h2>{t(connect ? "auth.loginTitle" : "auth.registerTitle")}</h2>
            <p>
              {t(connect ? "auth.loginIntro" : "auth.registerIntro")}
            </p>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stringToDecimal(
                inputName,
              )}.png`}
              alt={t("auth.userAlt")}
              draggable={false}
            />
          </div>
          {connect ? (
            <div className="login-container-inputs">
              <div className="login-inputs">
                <label htmlFor="login-name">{t("auth.username")}</label>
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
                <label htmlFor="login-password">{t("auth.password")}</label>
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
                <button onClick={() => handlePost("/api/login")}>
                  {t("auth.login")}
                </button>
                <small
                  className="login-change-pages"
                  onClick={() => navigate("/login/register")}
                >
                  {t("auth.createAccount")}
                </small>
              </div>
              <p className="login-privacy">
                {t("auth.loginPrivacy")}{" "}
                <a href="/api/mentions-legales" target="_blank" rel="noreferrer">
                  {t("auth.privacyLink")}
                </a>.
              </p>
            </div>
          ) : (
            <div className="login-container-inputs">
              <div className="login-inputs">
                <label htmlFor="register-name">{t("auth.username")}</label>
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
                <label htmlFor="register-password">{t("auth.password")}</label>
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
                <label htmlFor="register-confirm">
                  {t("auth.confirmPassword")}
                </label>
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
                  {t("auth.alreadyAccount")}
                </small>
                <button onClick={() => handlePost("/api/register")}>
                  {t("auth.register")}
                </button>
              </div>
              <p className="login-privacy">
                {t("auth.registerPrivacy")}{" "}
                <a href="/api/mentions-legales" target="_blank" rel="noreferrer">
                  {t("auth.privacyLink")}
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
