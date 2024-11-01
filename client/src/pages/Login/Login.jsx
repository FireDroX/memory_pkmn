import "./Login.css";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../utils/UserContext";

function Login() {
  const { setName, setIsLoggedIn } = useContext(UserContext);
  const navigate = useNavigate();
  const [inputName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState();

  const handlePost = async (postLink) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inputName, password: password }),
    };

    if (inputName === "" || password === "")
      setStatus("Both inputs are required.");
    else {
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
  };

  return (
    <section className="App">
      <div>
        <div className="login-container">
          {status ? <p style={{ color: "var(--text85)" }}>{status}</p> : false}
          <div className="login-inputs">
            <p>Your Username</p>
            <input
              type="text"
              name="name"
              value={inputName}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-inputs">
            <p>Put Your Password</p>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="login-buttons">
            <button onClick={() => handlePost("/login")}>Login</button>
            <button onClick={() => handlePost("/register")}>Register</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
