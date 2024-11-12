import { createContext, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    level: 0,
    xp: 0,
    inventory: [
      {
        colors: ["levels-color-default"],
      },
    ],
  });

  return (
    <UserContext.Provider
      value={{
        name,
        setName,
        isLoggedIn,
        setIsLoggedIn,
        userProfile,
        setUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
