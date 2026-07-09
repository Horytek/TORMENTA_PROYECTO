import React, { useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { loginRequest } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { setToken } from "@/utils/authStorage";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setUserRaw = useUserStore((state) => state.setUserRaw);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginRequest({ usuario, password });
      const { success, token, data, message } = response.data;

      if (success && token) {
        await setToken(token);
        setUserRaw(data);
        const roleId = Number(data.rol || data.id_rol || data.roleId);
        if (roleId) {
          await useUserStore.getState().loadPermissionsAndCapabilities(roleId);
        }
        // Redirigir según el rol o si es express
        if (data.rol === 3) {
          navigate("/express/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(message || "Credenciales incorrectas.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Error de conexión con el servidor. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden px-4">
      {/* Círculos de gradiente de fondo decorativos (Premium Glassmorphism) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-2xl rounded-2xl transition-all duration-300">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            Horytek ERP
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
            Ingresa tus credenciales para acceder a tu plataforma
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 text-center animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="nombre.apellido"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
                className="w-full bg-white/50 dark:bg-zinc-950/50 focus-visible:ring-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Contraseña</Label>
                <a href="#" className="text-xs text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/50 dark:bg-zinc-950/50 pr-10 focus-visible:ring-purple-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
              Al ingresar aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
