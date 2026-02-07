import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaShieldAlt, FaArrowLeft } from "react-icons/fa";
import { useUserStore } from "@/store/useStore";
import {
  Input,
  Button,
  Tabs,
  Tab,
  InputOtp,
  Link,
  Divider,
} from '@heroui/react';
import { useAuth } from "@/context/Auth/AuthProvider";
import AlertModal from "@/components/Modals/AlertModal";
import { expressLogin, expressRegister } from "@/services/express.services";
import { toast } from "react-hot-toast";

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

  // Express Mode State
  const [expressEmail, setExpressEmail] = useState("");
  const [expressPassword, setExpressPassword] = useState("");
  const [expressBusiness, setExpressBusiness] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);
  const [showExpressPassword, setShowExpressPassword] = useState(false);

  const navigate = useNavigate();
  const setNombre = useUserStore((state) => state.setNombre);
  const setIdRol = useUserStore((state) => state.setIdRol);
  const setSur = useUserStore((state) => state.setSur);
  const setIdTenant = useUserStore((state) => state.setIdTenant);

  // Contexto de autenticación
  const { login, isAuthenticated, sendAuthCode, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = user?.defaultPage || "/Inicio";
      navigate(redirectPath.toLowerCase());
    }
    setLoaded(true);
  }, [isAuthenticated, navigate, user]);

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

  const handleExpressSubmit = async (e) => {
    e.preventDefault();
    setAuthError(""); // Reuse authError for message
    setExpressLoading(true);
    try {
      if (isRegistering) {
        if (!expressBusiness || !expressEmail || !expressPassword) {
          setAuthError("Todos los campos son obligatorios.");
          setExpressLoading(false);
          return;
        }
        await expressRegister({
          business_name: expressBusiness,
          email: expressEmail,
          password: expressPassword
        });
      } else {
        if (!expressEmail || !expressPassword) {
          setAuthError("Ingrese correo y contraseña.");
          setExpressLoading(false);
          return;
        }
        await expressLogin({
          email: expressEmail,
          password: expressPassword
        });
      }
      navigate('/express/dashboard');
    } catch (error) {
      console.error(error);
      const errorData = error.response?.data;

      // Handle subscription expired specifically
      if (errorData?.error === 'SUBSCRIPTION_EXPIRED') {
        setAuthError(errorData.message || "Tu suscripción ha expirado.");
        toast.error(errorData.message, { duration: 5000, icon: '⚠️' });
      } else if (errorData?.error === 'USER_INACTIVE') {
        setAuthError(errorData.message || "Tu cuenta está desactivada.");
        toast.error(errorData.message, { duration: 4000 });
      } else {
        const msg = errorData?.message || "Error de conexión con Express Mode.";
        setAuthError(msg);
        toast.error(msg);
      }
    } finally {
      setExpressLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden p-4 sm:p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-zinc-950 to-zinc-950 z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] z-0 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] z-0" />

      {/* Main Card Container */}
      <div className={`relative z-10 w-full max-w-5xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 transition-all duration-700 ease-out transform ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
          <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>

          {/* Decorative circles inside card */}
          <div className="absolute top-10 left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <img src="/horycore.png" alt="HoryCore Logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">HoryCore</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Gestión inteligente para potenciar tu negocio
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Administra ventas, inventario y contabilidad desde una única plataforma segura, escalable y diseñada para la eficiencia.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
            <div className="space-y-1">
              <h3 className="text-white font-semibold">100% Cloud</h3>
              <p className="text-sm text-zinc-500">Acceso desde cualquier lugar</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-semibold">Seguridad Total</h3>
              <p className="text-sm text-zinc-500">Datos encriptados</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-semibold">Soporte 24/7</h3>
              <p className="text-sm text-zinc-500">Siempre disponibles</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-semibold">Actualizaciones</h3>
              <p className="text-sm text-zinc-500">Mejora continua</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-zinc-900/20 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          {/* Logo always visible on mobile/tablet or just centered */}
          <div className="flex flex-col items-center mb-8">
            <div className="lg:hidden mb-4">
              <img src="/horycore.png" alt="HoryCore" className="w-12 h-12 rounded-lg shadow-sm" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {activeTab === 'login' ? 'Iniciar sesión' : 'Autenticar cuenta'}
            </h2>
            <p className="text-sm text-zinc-400 text-center">
              {activeTab === 'login' ? 'Ingrese sus credenciales para continuar' : 'Ingrese el código de seguridad'}
            </p>
          </div>

          <div className="max-w-[380px] w-full mx-auto">
            <Tabs
              aria-label="Opciones de acceso"
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
              variant="solid"
              color="primary"
              className="w-full mb-6"
              classNames={{
                tabList: "w-full bg-zinc-800/40 p-1 rounded-2xl border border-white/5",
                cursor: "w-full bg-zinc-700 shadow-lg rounded-xl",
                tab: "h-10 text-sm",
                tabContent: "group-data-[selected=true]:text-white text-zinc-500 font-semibold"
              }}
            >
              <Tab key="login" title="Sistema ERP" />
              <Tab key="express" title="Pocket POS" />
              <Tab key="auth" title="Validar" />
            </Tabs>

            <div className="mt-2">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Usuario Input - Gray Background Style */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 ml-1">
                      Usuario
                    </label>
                    <Input
                      type="text"
                      placeholder="Ingrese su usuario"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      // Removed startContent to match simple original aesthetic if preferred, but user said "diseño de campos originales".
                      // Original had no icons inside input in the screenshot provided? Actually screenshot shows "Usuario" label and simple input.
                      // I will keep it simple without icon inside to match "original".
                      variant="flat"
                      radius="md"
                      classNames={{
                        input: "!text-white placeholder:!text-zinc-400 text-base",
                        inputWrapper: "h-12 bg-zinc-800/50 hover:bg-zinc-800/80 border-white/5 transition-colors shadow-none data-[hover=true]:bg-zinc-800/80 group-data-[focus=true]:bg-zinc-800/80",
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 ml-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        variant="flat"
                        radius="md"
                        endContent={
                          <button className="focus:outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                              <FaEyeSlash className="text-lg text-zinc-400" />
                            ) : (
                              <FaEye className="text-lg text-zinc-400" />
                            )}
                          </button>
                        }
                        classNames={{
                          input: "!text-white placeholder:!text-zinc-400 text-base",
                          inputWrapper: "h-12 bg-zinc-800/50 hover:bg-zinc-800/80 border-white/5 transition-colors shadow-none data-[hover=true]:bg-zinc-800/80 group-data-[focus=true]:bg-zinc-800/80",
                        }}
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Link href="#" size="sm" className="text-blue-400 font-medium hover:text-blue-300 cursor-pointer text-xs">
                        ¿Olvidó su contraseña?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    color="primary"
                    className="w-full h-12 font-bold text-base shadow-lg shadow-blue-500/20"
                    radius="md"
                  >
                    Iniciar sesión
                  </Button>
                </form>
              ) : activeTab === 'express' ? (
                <form onSubmit={handleExpressSubmit} className="space-y-5">
                  <div className="flex justify-center mb-2">
                    <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
                      Modo Pocket POS (Beta)
                    </div>
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 ml-1">Correo Electrónico</label>
                    <Input
                      type="text"
                      placeholder="correo@negocio.com"
                      value={expressEmail}
                      onChange={(e) => setExpressEmail(e.target.value)}
                      variant="flat"
                      radius="md"
                      classNames={{
                        input: "!text-zinc-100 placeholder:!text-zinc-500",
                        inputWrapper: "bg-zinc-800/50 data-[hover=true]:bg-zinc-800/80 group-data-[focus=true]:bg-zinc-800 !border-none !shadow-none !ring-0 !ring-offset-0 !outline-none h-12"
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-300 ml-1">Contraseña</label>
                    <div className="relative">
                      <Input
                        type={showExpressPassword ? "text" : "password"}
                        placeholder="********"
                        value={expressPassword}
                        onChange={(e) => setExpressPassword(e.target.value)}
                        variant="flat"
                        radius="md"
                        endContent={
                          <button className="focus:outline-none" type="button" onClick={() => setShowExpressPassword(!showExpressPassword)}>
                            {showExpressPassword ? (
                              <FaEyeSlash className="text-lg text-zinc-400" />
                            ) : (
                              <FaEye className="text-lg text-zinc-400" />
                            )}
                          </button>
                        }
                        classNames={{
                          input: "!text-zinc-100 placeholder:!text-zinc-500",
                          inputWrapper: "bg-zinc-800/50 data-[hover=true]:bg-zinc-800/80 group-data-[focus=true]:bg-zinc-800 !border-none !shadow-none !ring-0 !ring-offset-0 !outline-none h-12"
                        }}
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-900/20 border border-red-500/20 text-red-500 text-xs rounded-lg text-center font-semibold">
                      {authError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                    radius="md"
                    isLoading={expressLoading}
                  >
                    Acceder a Pocket POS
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-center mb-4">
                    <InputOtp
                      length={4}
                      value={otpValue}
                      onValueChange={setOtpValue}
                      allowedKeys="^[0-9]*$"
                      containerClassName="hc-login-otp"
                      classNames={{
                        inputWrapper: "w-full",
                        segmentWrapper: "flex justify-center gap-3",
                        segment:
                          "w-12 h-12 rounded-lg border !border-white/10 !bg-zinc-950/60 !text-white " +
                          "flex items-center justify-center text-2xl font-bold leading-none overflow-visible " +
                          "data-[active=true]:!border-emerald-400 data-[active=true]:ring-2 data-[active=true]:ring-emerald-400/50 " +
                          "data-[active=true]:!bg-zinc-950/70",
                      }}
                    />

                  </div>

                  <p className="text-center text-xs text-zinc-400 px-2 leading-relaxed">
                    Ingrese el código de acceso de 4 dígitos enviado a su correo.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-zinc-300 ml-1">
                        Usuario
                      </label>
                      <Input
                        type="text"
                        placeholder="Ingrese su usuario"
                        value={authUser}
                        onChange={(e) => setAuthUser(e.target.value)}
                        variant="flat"
                        radius="md"
                        classNames={{
                          input: "!text-white placeholder:!text-zinc-400 text-base",
                          inputWrapper: "h-11 bg-zinc-800/50 hover:bg-zinc-800/80 border-white/5 transition-colors shadow-none data-[hover=true]:bg-zinc-800/80 group-data-[focus=true]:bg-zinc-800/80",
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-zinc-300 ml-1">
                        Contraseña
                      </label>
                      <Input
                        type="password"
                        placeholder="Ingrese su contraseña"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        variant="flat"
                        radius="md"
                        classNames={{
                          input: "!text-white placeholder:!text-zinc-400 text-base",
                          inputWrapper: "h-11 bg-zinc-800/50 hover:bg-zinc-800/80 border-white/5 transition-colors shadow-none data-[hover=true]:bg-zinc-800/80 group-data-[focus=true]:bg-zinc-800/80",
                        }}
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-900/20 border border-red-500/20 text-red-500 text-xs rounded-lg text-center font-semibold">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg text-center font-semibold">
                      ¡Verificado correctamente!
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    radius="md"
                    isLoading={otpLoading}
                  >
                    Verificar y activar cuenta
                  </Button>
                </form>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-zinc-500 mb-4">
                ¿No tiene cuenta? <span className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium hover:underline">Contacte a su administrador</span>
              </p>
              <Button
                variant="flat"
                className="w-full bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onPress={() => navigate('/landing')}
              >
                <FaArrowLeft className="mr-2" />
                Volver a la página principal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <AlertModal
          message="Credenciales incorrectas. Por favor verifique sus datos."
          onClose={() => setShowAlert(false)}
        />
      )}
    </div>
  );
}

export default Login;