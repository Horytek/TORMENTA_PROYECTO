import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaRegBuilding, FaEyeSlash } from "react-icons/fa";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
} from "@nextui-org/react";

import { useAuth } from "@/context/Auth/AuthProvider";
import AlertModal from "@/components/Modals/AlertModal";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // Contexto de autenticación
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/Inicio");
    }
    setLoaded(true);
  }, [isAuthenticated, navigate]);

  // Maneja el evento de inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!usuario || !password) {
      setShowAlert(true);
      return;
    }

    try {
      const user = { usuario, password };
      const response = await login(user);
      if (response.success) {
        localStorage.setItem("usuario", usuario);
        localStorage.setItem("rol", response.data.rol);
        localStorage.setItem("sur", response.data.sucursal);

        const redirectPage = response.data.defaultPage || "/inicio";
        navigate(redirectPage);
      } else {
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setShowAlert(true);
    }
  };

  return (
  <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Lado izquierdo (Branding) */}
      <div className={`hidden md:flex items-center justify-center w-1/2 bg-gradient-to-br from-primary to-secondary transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Una plataforma para administrar todo su negocio</h2>
          <div className="grid grid-cols-2 gap-6 mt-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-left">
              <h3 className="text-lg font-semibold mb-2">Adaptable</h3>
              <p className="text-white/80 text-sm">Personalizable para cualquier industria o tamaño de negocio</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-left">
              <h3 className="text-lg font-semibold mb-2">Completo</h3>
              <p className="text-white/80 text-sm">Gestión integral de ventas, compras, inventario y contabilidad</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-left">
              <h3 className="text-lg font-semibold mb-2">Seguro</h3>
              <p className="text-white/80 text-sm">Arquitectura multi-tenancy con aislamiento total de datos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-left">
              <h3 className="text-lg font-semibold mb-2">Escalable</h3>
              <p className="text-white/80 text-sm">Crece con su negocio sin comprometer el rendimiento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className={`flex items-center justify-center w-full md:w-1/2 p-6 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 transform-gpu">HORYTEK NEGOCIOS</h1>

          </div>

          <Card
            className="w-full max-w-md"
            style={{
              boxShadow: '0 10px 20px hsl(0,0%,.15), 20 15px 10px hsl(0,0%,.10)',
            }}
          >
            <CardHeader className="flex flex-col items-center space-y-1 mt-2 mb-2 ">

              <h2 className="text-2xl font-semibold text-center">Iniciar sesión</h2>
              <p
                className="text-small text-default-400"
                style={{ fontSize: "14px", userSelect: "none", marginTop: "2px" }}
              >
                Ingrese sus credenciales para continuar
              </p>
            </CardHeader>

            <CardBody className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Campo de usuario */}
                <div className="space-y-2">
                  <label htmlFor="usuario" className="text-sm font-semibold block">
                    Usuario
                  </label>
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full border border-gray-300 rounded-md"
                    aria-label="Usuario"
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Campo de contraseña */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-sm font-semibold">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="w-full border border-gray-300 rounded-md pr-10"
                      aria-label="Contraseña"
                      required
                      autoComplete="current-password"
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Mostrar/ocultar contraseña"
                    >
                      {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-white hover:bg-primary-dark"
                  aria-label="Iniciar sesión"
                >
                  Iniciar sesión
                </Button>
              </form>
            </CardBody>

            <CardFooter className="flex flex-col space-y-2">
              <p className="text-xs text-center text-gray-500 w-full">
                ¿No tiene cuenta? Contacte con su administrador
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de alerta en caso de error */}
      {showAlert && (
        <AlertModal
          message="Usuario o contraseña incorrectos"
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
}

export default Login;
