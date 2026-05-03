import "./App.css";
import { useState, useLayoutEffect, useContext, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { UserContext } from "./utils/UserContext";

import Navbar from "./components/Navbar/Navbar";

const Home = lazy(() => import("./pages/Home/Home"));
const Login = lazy(() => import("./pages/Login/Login"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Online = lazy(() => import("./pages/Memory/Online/Online"));
const Leaderboard = lazy(() => import("./pages/Leaderboard/Leaderboard"));
const Colors = lazy(() => import("./pages/Colors/Colors"));

function App() {
  const { setName, isLoggedIn, setIsLoggedIn, setUserProfile } =
    useContext(UserContext);
  const location = useLocation();

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
          if (json?.status === "") {
            setName(name);
            setIsLoggedIn(true);
            setUserProfile(json.profile);
          }
        });
      }
    });
  }, []);

  return (
    <>
      <Navbar />
      <Routes location={location}>
        <Route path="/" element={<Navigate to={"/login"} replace />} />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to={"/profile"} replace />
            ) : (
              <Login connect={true} />
            )
          }
        />
        <Route
          path="/login/register"
          element={
            isLoggedIn ? (
              <Navigate to={"/profile"} replace />
            ) : (
              <Login connect={false} />
            )
          }
        />
        <Route
          path="/online"
          element={
            <Online id={new URLSearchParams(location.search).get("id")} />
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? <Profile /> : <Navigate to={"/login"} replace />
          }
        />
        <Route
          path="/profile/colors"
          element={isLoggedIn ? <Colors /> : <Navigate to={"/login"} replace />}
        />
        <Route
          path="/profile/leaderboard"
          element={
            isLoggedIn ? <Leaderboard /> : <Navigate to={"/login"} replace />
          }
        />
      </Routes>
    </>
  );
}

export default App;
