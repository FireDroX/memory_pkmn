import "./App.css";
import { useContext, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router";
import { UserContext } from "./utils/UserContext";

import Navbar from "./components/Navbar/Navbar";
import { Loadable } from "./components/Loading/Loading";

const Home = lazy(() => import("./pages/Home/Home"));
const Login = lazy(() => import("./pages/Login/Login"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Online = lazy(() => import("./pages/Memory/Online/Online"));
const Leaderboard = lazy(() => import("./pages/Leaderboard/Leaderboard"));
const Colors = lazy(() => import("./pages/Colors/Colors"));

function App() {
  const { isLoggedIn } = useContext(UserContext);
  const location = useLocation();

  return (
    <>
      <Navbar />
      <Routes location={location}>
        <Route path="/" element={Loadable(Home)} />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to={"/profile"} replace />
            ) : (
              Loadable(Login, { connect: true })
            )
          }
        />
        <Route
          path="/login/register"
          element={
            isLoggedIn ? (
              <Navigate to={"/profile"} replace />
            ) : (
              Loadable(Login, { connect: false })
            )
          }
        />
        <Route
          path="/online"
          element={
            isLoggedIn ? (
              Loadable(Online, {
                id: new URLSearchParams(location.search).get("id"),
              })
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? Loadable(Profile) : <Navigate to={"/login"} replace />
          }
        />
        <Route
          path="/profile/colors"
          element={
            isLoggedIn ? Loadable(Colors) : <Navigate to={"/login"} replace />
          }
        />
        <Route
          path="/profile/leaderboard"
          element={
            isLoggedIn ? (
              Loadable(Leaderboard)
            ) : (
              <Navigate to={"/login"} replace />
            )
          }
        />
      </Routes>
      <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-two" aria-hidden="true" />
    </>
  );
}

export default App;
