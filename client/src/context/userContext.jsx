import { createContext, useContext, useState, useMemo } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState("");
  const [sur, setSur] = useState("");

  const clearUser = () => {
    setUsuario("");
    setRol("");
    setSur("");
  };

  const value = useMemo(() => ({
    usuario, setUsuario, rol, setRol, sur, setSur, clearUser
  }), [usuario, rol, sur]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}