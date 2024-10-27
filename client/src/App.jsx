import "./App.css";
import { useState, useLayoutEffect, useContext } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { UserContext } from "./utils/UserContext";

import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Profile from "./pages/Profile/Profile";
import Online from "./pages/Memory/Online/Online";

function App() {
  const { setName, setIsLoggedIn } = useContext(UserContext);
  function DynamicPage() {
    const [page, setPage] = useState(null);
    const [roomID, setRoomID] = useState(null);
    const location = useLocation();

    useLayoutEffect(() => {
      const queryParams = new URLSearchParams(location.search);
      setPage(queryParams.get("query"));
      setRoomID(queryParams.get("id"));
    }, [location]);

    switch (page) {
      case "login":
        return <Login />;
      case "profile":
        return <Profile />;
      case "online":
        return <Online id={roomID} />;
      default:
        return <Home />;
    }
  }

  useLayoutEffect(() => {
    const logInfos = window.localStorage.getItem("super-secret-login-info");
    if (!logInfos) return;

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: logInfos,
    };

    const { name } = JSON.parse(logInfos);

    fetch("/login", requestOptions).then((data) => {
      if (data.status === 200) {
        setName(name);
        setIsLoggedIn(true);
      }
    });
  }, []);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="*" element={<DynamicPage />} />
      </Routes>
    </>
  );
}

export default App;
