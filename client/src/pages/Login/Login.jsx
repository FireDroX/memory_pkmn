import "./Login.css";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../utils/UserContext";

function Login() {
  const { setName, setIsLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();
  const [inputName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState();
  const [connect, setConnect] = useState(true);

  const handlePost = async (postLink) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inputName, password: password }),
    };

    if (inputName === "" || password === "")
      setStatus("Both inputs are required.");
    else {
      if (postLink === "/register") {
        if (password !== confirmPassword)
          return setStatus("Passwords need to be the same.");
      }
      const data = await fetch(postLink, requestOptions);
      const json = await data.json();

      setStatus(json?.status);
      if (json?.status === "" && postLink === "/login") {
        setName(inputName);
        setIsLoggedIn(true);
        window.localStorage.setItem(
          "super-secret-login-info",
          JSON.stringify({ name: inputName, password: password })
        );
        navigate("");
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
        handlePost(connect ? "/login" : "/register");
      }
    };

    // Attach event listener for keydown
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [connect, inputName, password, confirmPassword]);

  return (
    <section className="App">
      <div>
        <div className="login-container">
          {connect ? (
            <>
              {status ? (
                <p style={{ color: "var(--text85)" }}>{status}</p>
              ) : (
                false
              )}
              <div className="login-inputs">
                <p>Your Username</p>
                <input
                  type="text"
                  name="name"
                  value={inputName}
                  onChange={handleInputChange}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-inputs">
                <p>Put Your Password</p>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-buttons">
                <button onClick={() => handlePost("/login")}>Login</button>
                <small
                  className="login-change-pages"
                  onClick={() => setConnect(false)}
                >
                  Create Your Account
                </small>
              </div>
            </>
          ) : (
            <>
              {" "}
              {status ? (
                <p style={{ color: "var(--text85)" }}>{status}</p>
              ) : (
                false
              )}
              <div className="login-inputs">
                <p>Your Username</p>
                <input
                  type="text"
                  name="name"
                  value={inputName}
                  onChange={handleInputChange}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-inputs">
                <p>Put Your Password</p>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={25}
                  minLength={1}
                />
              </div>
              <div className="login-inputs">
                <p>Confirm Your Password</p>
                <input
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
                  onClick={() => setConnect(true)}
                >
                  Log in Your Account
                </small>
                <button onClick={() => handlePost("/register")}>
                  Register
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Login;
