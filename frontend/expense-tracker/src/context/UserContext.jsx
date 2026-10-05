import React, { createContext, useEffect, useState} from "react";

export const UserContext = createContext();

const UserProvider = ({ children }) =>{
  const [user, setUser] = useState(null);

  // function to update user data
  const updateUser = (userData) =>{
    setUser(userData);
  };

  // function to clear user data(e.g, on layout)
  const clearUser =()=>{
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem("token");
      setUser(null);
    };

    const handleStorageChange = (event) => {
      if (event.key !== "token" || event.newValue !== null || !event.oldValue) return;

      setUser(null);
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <UserContext.Provider
     value={
      {
        user,
        updateUser,
        clearUser,
        logout,
      }
     }
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;