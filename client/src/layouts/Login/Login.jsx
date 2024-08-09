import './Login.css';
import { useState } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import loginImage from '@/assets/img-login.png';
import AlertModal from '@/components/Modals/AlertModal';

// Auth Context
import { useAuth } from '@/context/Auth/AuthProvider';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Contexto de autenticación
  const { login, isAuthenticated } = useAuth();

  if  (isAuthenticated) {
    navigate('/Inicio');
  } else {
    redirect('/Login');
  }

  // Maneja el evento de inicio de sesión
  const handleLogin = async () => {
    try {
      const user = { usuario, password };
      const response = await login(user);
      if (response.success) {
        localStorage.setItem('usuario', usuario);
        navigate('/Inicio');
      } else {
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setShowAlert(true);
    }
  };

  // Renderiza un campo de entrada con o sin opción de mostrar/ocultar contraseña
  const renderInputField = (type, value, setValue, placeholder, label, showToggle = false) => (
    <div className="input-container relative mb-4">
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input-field w-full px-4 py-2 rounded-lg focus:outline-none border border-gray-300 focus:border-gray-300 focus:ring-gray-300"
        placeholder={placeholder}
        autoComplete='current-password'
      />
      <label className={`input-label absolute left-4 transition-all pointer-events-none pt-1.5 ${value ? '-top-0' : 'top-0'}`}>
        {label}
      </label>
      {showToggle && (
        <div
          className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </div>
      )}
    </div>
  );

  return (
    <form>
      <div className="min-h-screen flex items-center justify-center bg-[#a07ce9]">
        {/* Fondos decorativos */}
        <div className="bg-circle-top-left absolute top-0 left-0 w-96 h-96 rounded-full z-0"></div>
        <div className="bg-circle-top-right absolute top-0 right-0 w-40 h-40 rounded-full z-0"></div>
  
        {/* Contenedor principal del formulario */}
        <div className="login-container rounded-lg z-10 grid grid-cols-1 lg:grid-cols-2 w-[70vw] h-[70vh]">
          {/* Panel izquierdo (formulario de inicio de sesión) */}
          <div className="login-form bg-white flex flex-col justify-center p-20">
            <h1 className="text-3xl font-bold text-center pb-14">Iniciar Sesión</h1>
  
            {renderInputField("email", usuario, setUsuario, "Tormenta", "Usuario")}
            {renderInputField(showPassword ? "text" : "password", password, setPassword, "*******", "Contraseña", true)}
  
            <button
              onClick={handleLogin}
              className="login-button w-full text-white py-2 rounded focus:outline-none bg-[#00BDD6]"
            >
              Iniciar sesión
            </button>
          </div>
  
          {/* Panel derecho (imagen u otros contenidos relacionados) */}
          <div className="login-image-container lg:flex lg:items-center lg:justify-center hidden bg-white border-l-2 border-[#e7e4e4]">
            <img src={loginImage} alt="Login Image" className="h-max" />
          </div>
        </div>
  
        {showAlert && (
          <AlertModal
            message="Usuario o contraseña incorrectos"
            onClose={() => setShowAlert(false)}
          />
        )}
      </div>
    </form>
  );
}

export default Login;
