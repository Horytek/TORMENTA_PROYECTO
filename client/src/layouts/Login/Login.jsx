import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useUserStore } from "@/store/useStore";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Tabs,
  Tab,
  InputOtp
} from '@heroui/react';
import { useAuth } from "@/context/Auth/AuthProvider";
import AlertModal from "@/components/Modals/AlertModal";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Para autenticación de cuentas (activación)
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const navigate = useNavigate();
  const setNombre = useUserStore((state) => state.setNombre);
  const setIdRol = useUserStore((state) => state.setIdRol);
  const setSur = useUserStore((state) => state.setSur);
  const setIdTenant = useUserStore((state) => state.setIdTenant);

  // Contexto de autenticación
  const { login, isAuthenticated, sendAuthCode } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/Inicio");
    }
    setLoaded(true);
  }, [isAuthenticated, navigate]);

  // Maneja el evento de inicio de sesión normal
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usuario || !password) {
      setShowAlert(true);
      return;
    }
    try {
      const response = await login({ usuario, password });
      if (response?.success) {
        setNombre(response.data.usuario);
        setIdRol(response.data.rol);
        setSur(response.data.sucursal);
        setIdTenant(response.data.id_tenant || null);
        const redirectPage = response.data?.defaultPage || "/inicio";
        navigate(redirectPage.toLowerCase());
      } else {
        setShowAlert(true);
      }
    } catch (error) {
      setShowAlert(true);
    }
  };

  // Verificar código OTP y autenticar
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess(false);
    if (!authUser || !authPassword || !otpValue) {
      setAuthError("Debe ingresar usuario, contraseña y código.");
      return;
    }
    setOtpLoading(true);
    const res = await sendAuthCode({
      usuario: authUser,
      password: authPassword,
      clave_acceso: otpValue
    });
    setOtpLoading(false);
    if (res?.success) {
      setAuthSuccess(true);
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setAuthError(res?.message || "Código incorrecto o expirado.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#f6f9ff] dark:bg-[#10131a]">
      {/* Lado izquierdo (Branding) */}
      <div className={`hidden md:flex items-center justify-center w-1/2 bg-gradient-to-br from-primary to-secondary transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="px-8 md:px-12 py-10 text-center text-white">
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

      {/* Login & Auth Tabs */}
      <div className="flex items-center justify-center w-full md:w-1/2 p-4 sm:p-6 transition-opacity duration-500">
        <div className="w-full flex flex-col items-center justify-center">
          {/* Branding */}
          <div className="w-full flex flex-col items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/horycore.png"
                alt="HoryCore"
                className="hidden sm:block w-10 h-10 rounded-lg"
              />
              <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
                HoryCore
              </span>
            </div>
            <span className="mt-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">
              ERP Empresarial
            </span>
          </div>

          {/* Contenedor centrado y ancho fijo para Tabs y Cards */}
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center justify-center">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                variant="bordered"
                color="primary"
                className="mb-4 sm:mb-6 w-full max-w-[350px] mx-auto"
                classNames={{
                  tabList: "bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow border border-blue-100/30 dark:border-zinc-700/30 px-1.5 py-1 flex gap-1.5 sm:gap-2 justify-center",
                  tab: "px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold rounded-lg transition-colors",
                  tabContent: "py-0"
                }}
              >
                <Tab key="login" title="Iniciar sesión">
                  <div className="flex justify-center w-full">
                    <Card className="w-full max-w-[420px] mx-auto" style={{ boxShadow: '0 10px 32px 0 #e0e7ef44' }}>
                      <CardHeader className="flex flex-col items-center space-y-1 mt-2 mb-2 ">
                        <h2 className="text-2xl font-semibold text-center">Iniciar sesión</h2>
                        <p className="text-small text-default-400" style={{ fontSize: "14px", userSelect: "none", marginTop: "2px" }}>
                          Ingrese sus credenciales para continuar
                        </p>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="usuario" className="text-sm font-semibold block">Usuario</label>
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
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label htmlFor="password" className="text-sm font-semibold">Contraseña</label>
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
                </Tab>
                <Tab key="auth" title="Autenticar cuenta">
                  <div className="flex justify-center w-full">
                    <Card className="w-full max-w-[420px] mx-auto" style={{ boxShadow: '0 10px 32px 0 #e0e7ef44' }}>
                      <CardHeader className="flex flex-col items-center space-y-1 mt-2 mb-2 ">
                        <h2 className="text-2xl font-semibold text-center">Autenticar cuenta</h2>
                        <p className="text-small text-default-400 text-center" style={{ fontSize: "14px", userSelect: "none", marginTop: "2px" }}>
                          Ingresa tu usuario, contraseña y el <b>código de 4 dígitos</b> que recibiste por correo tras realizar el pago.<br />
                          <span className="text-emerald-500 font-semibold">Importante:</span> Si no tienes el código, revisa tu correo o contacta a soporte.
                        </p>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                          <div className="space-y-2 flex flex-col items-center">
                            <label htmlFor="otp" className="text-sm font-semibold block text-center">Código de autenticación (4 dígitos)</label>
                            <InputOtp
                              length={4}
                              value={otpValue}
                              onValueChange={setOtpValue}
                              containerClassName="justify-center"
                              className="mx-auto"
                              inputClassName="w-12 h-12 text-2xl font-mono border-2 border-secondary-color rounded-lg mx-1 bg-white dark:bg-zinc-900 text-secondary-color focus:ring-2 focus:ring-secondary-color transition-all"
                            />
                          </div>
                          <div className="space-y-2 w-full max-w-[340px] mx-auto">
                            <label htmlFor="authUser" className="text-sm font-semibold block">Usuario</label>
                            <Input
                              id="authUser"
                              type="text"
                              placeholder="Ingrese su usuario"
                              value={authUser}
                              onChange={(e) => setAuthUser(e.target.value)}
                              className="w-full border border-gray-300 rounded-md"
                              aria-label="Usuario"
                              required
                            />
                          </div>
                          <div className="space-y-2 w-full max-w-[340px] mx-auto">
                            <label htmlFor="authPassword" className="text-sm font-semibold block">Contraseña</label>
                            <Input
                              id="authPassword"
                              type="password"
                              placeholder="Ingrese su contraseña"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full border border-gray-300 rounded-md"
                              aria-label="Contraseña"
                              required
                            />
                          </div>
                          {authError && <div className="text-xs text-red-500 text-center">{authError}</div>}
                          {authSuccess && (
                            <div className="text-center text-secondary-color font-semibold py-2 text-lg">
                              ¡Cuenta autenticada correctamente! Redirigiendo...
                            </div>
                          )}
                          <Button
                            type="submit"
                            className="w-full bg-secondary-color text-white hover:bg-secondary-color/90"
                            aria-label="Verificar código"
                            isLoading={otpLoading}
                          >
                            Verificar y activar cuenta
                          </Button>
                        </form>
                        <div className="text-xs text-gray-500 text-center mt-2">
                          Si no tienes el código, revisa tu correo (incluyendo spam) o solicita soporte.
                        </div>
                      </CardBody>
                      <CardFooter className="flex flex-col space-y-2">
                        <p className="text-xs text-center text-gray-500 w-full">
                          Si tienes problemas, contacta a soporte.
                        </p>
                      </CardFooter>
                    </Card>
                  </div>
                </Tab>
              </Tabs>
            </div>
          </div>
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