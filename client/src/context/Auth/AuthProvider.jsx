import { AuthContext } from "./AuthContext";
import { redirect } from 'react-router-dom';
import { useEffect, useContext, useState } from "react";
import { loginRequest,logoutRequest,nameRequest, verifyTokenRequest } from "../../api/api.auth";
//import Cookies from "js-cookie";

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within a AuthProvider");
    return context;  
};

export const AuthProvider = ({ children }) => {
    
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const login = async (user) => {
      try {
          const res = await loginRequest(user);
          sessionStorage.setItem("token", res.data.token); // Guardar el token en sessionStorage
          //localStorage.setItem("estado_token", 1);
          setUser(res.data.data);
          setIsAuthenticated(true);
          return res.data;
      } catch (error) {
          console.log(error);
      }
  };

  const logout = async () => {
    try {
        const token = sessionStorage.getItem("token");
        logoutRequest(token);
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("token"); // Eliminar el token de sessionStorage
        //localStorage.setItem("estado_token", 0);
        setUser(null);
        setIsAuthenticated(false);
        redirect('/');
    } catch (error) {
        console.log(error);
    }
};

useEffect(() => {
  const checkLogin = async () => {

    if (performance.navigation.type === performance.navigation.TYPE_RELOAD || performance.navigation.type === 0) {
        //sessionStorage.setItem('reload', 'true');
      } else {
       /* const usua = localStorage.getItem("usuario");

        const usuario = {
                usua: usua
        };

        nameRequest(usuario);*/
        sessionStorage.removeItem("token"); // Eliminar el token de sessionStorage
      }
      
      const token = sessionStorage.getItem("token");

      if (!token) {
            const usua = localStorage.getItem("usuario");

            const usuario = {
                usua: usua
            };

          nameRequest(usuario);
          //localStorage.setItem("estado_token", 0);
          setIsAuthenticated(false);
          setLoading(false);
          return;
      }

      try {
          const res = await verifyTokenRequest(token); // Pasa el token en la petición
          if (!res.data) return setIsAuthenticated(false);
          setIsAuthenticated(true);
          setUser(res.data);
          setLoading(false);
      } catch (error) {
          setIsAuthenticated(false);
          setLoading(false);
      }
  };

  checkLogin();
}, []);


    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            loading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}