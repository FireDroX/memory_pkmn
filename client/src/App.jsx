import "./App.css";
import { useState, useLayoutEffect, useContext } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { UserContext } from "./utils/UserContext";

import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Profile from "./pages/Profile/Profile";
import Online from "./pages/Memory/Online/Online";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Colors from "./pages/Colors/Colors";

function App() {
  const { setName, isLoggedIn, setIsLoggedIn, setUserProfile } =
    useContext(UserContext);
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
      case "leaderboard":
        return <Leaderboard />;
      case "login":
        return <Login />;
      case "online":
        return <Online id={roomID} />;
      case "profile":
        return isLoggedIn ? <Profile /> : <Home />;
      case "colors":
        return isLoggedIn ? <Colors /> : <Home />;
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
        data.json().then((json) => {
          setName(name);
          setIsLoggedIn(true);
          setUserProfile(json.profile);
        });
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
