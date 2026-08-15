import { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

const emptyProfile = () => ({
  inventory: [{ colors: [] }],
  xp: 0,
  xpNeeded: 100,
  level: 1,
  achievements: [0],
});

const emptyStats = () => ({
  onlineGamesPlayed: 0,
  onlineGamesWon: 0,
  onlineGamesLost: 0,
  onlineWinRate: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  totalPairsFound: 0,
  shinyPairsFound: 0,
  soloGamesPlayed: 0,
  soloGamesWon: 0,
  soloWinRate: 0,
  soloBestRemainingTries: 0,
  createdAt: null,
});

export const UserProvider = ({ children }) => {
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [userProfile, setUserProfile] = useState(emptyProfile);
  const [userStats, setUserStats] = useState(emptyStats);

  const authenticate = (user) => {
    setName(user.name);
    setUserProfile(user.profile);
    setUserStats(user.stats);
    setIsLoggedIn(true);
  };

  const clearAuthentication = () => {
    setName("");
    setIsLoggedIn(false);
    setUserProfile(emptyProfile());
    setUserStats(emptyStats());
  };

  useEffect(() => {
    let active = true;

    fetch("/api/login/session")
      .then(async (response) => {
        if (!response.ok) return;
        const user = await response.json();
        if (active) authenticate(user);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsSessionReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = {
    name,
    authenticate,
    clearAuthentication,
    isLoggedIn,
    isSessionReady,
    userProfile,
    setUserProfile,
    userStats,
    setUserStats,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
