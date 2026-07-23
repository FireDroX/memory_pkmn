import { createContext, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    inventory: [{ colors: [] }],
    xp: 0,
    xpNeeded: 100,
    level: 1,
    achievements: [0],
  });
  const [userStats, setUserStats] = useState({
    onlineGamesWon: 0,
    shinyPairsFound: 0,
    createdAt: null,
  });

  const value = {
    name,
    setName,
    isLoggedIn,
    setIsLoggedIn,
    userProfile,
    setUserProfile,
    userStats,
    setUserStats,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
