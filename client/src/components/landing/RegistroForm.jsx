import React, { useState } from 'react';
import WalletBrick from './WalletBrick';

export const RegistroForm = ({ planInfo }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    empresa: '',
    direccion: '',
    ciudad: '',
    pais: '',
    aceptaTerminos: false
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Limpiar error al cambiar el valor
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!formData.nombre.trim()) {
      formErrors.nombre = 'El nombre es obligatorio';
      isValid = false;
    }

    if (!formData.apellido.trim()) {
      formErrors.apellido = 'El apellido es obligatorio';
      isValid = false;
    }

    if (!formData.email.trim()) {
      formErrors.email = 'El email es obligatorio';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      formErrors.email = 'El email no es válido';
      isValid = false;
    }

    if (!formData.telefono.trim()) {
      formErrors.telefono = 'El teléfono es obligatorio';
      isValid = false;
    }

    if (!formData.aceptaTerminos) {
      formErrors.aceptaTerminos = 'Debe aceptar los términos y condiciones';
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Solo mostramos el botón de pago al enviar el formulario
      setFormSubmitted(true);
    }
  };

  return (
    <div 
      className="rounded-3xl p-6 md:p-8" 
      style={{
        backgroundColor: 'rgba(48, 49, 54, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="mb-6">
        <h3 className="text-xl md:text-2xl font-semibold mb-2 text-primary-text">Detalles del plan</h3>
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg bg-gray-800/50">
          <div className="flex-1">
            <p className="font-medium text-lg text-primary-text">{planInfo.plan}</p>
            <p className="text-gray-400">{planInfo.price} / {planInfo.period}</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
            {planInfo.price === 'S/ 0' ? 'Gratis' : 'Premium'}
          </div>
        </div>
      </div>

      {!formSubmitted ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-primary-text mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-gray-800/50 border ${
                  errors.nombre ? 'border-red-500' : 'border-gray-700'
                } text-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Tu nombre"
              />
              {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-primary-text mb-1">
                Apellido
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-gray-800/50 border ${
                  errors.apellido ? 'border-red-500' : 'border-gray-700'
                } text-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Tu apellido"
              />
              {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-gray-800/50 border ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                } text-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="tu@email.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-primary-text mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg bg-gray-800/50 border ${
                  errors.telefono ? 'border-red-500' : 'border-gray-700'
                } text-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Tu teléfono"
              />
              {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="empresa" className="block text-sm font-medium text-primary-text mb-1">
              Nombre de la empresa (opcional)
            </label>
            <input
              type="text"
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de tu empresa"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="aceptaTerminos"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <label htmlFor="aceptaTerminos" className="ml-2 block text-sm text-gray-300">
                Acepto los <span className="text-blue-400 hover:underline cursor-pointer">términos y condiciones</span>
              </label>
            </div>
            {errors.aceptaTerminos && <p className="mt-1 text-xs text-red-500">{errors.aceptaTerminos}</p>}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-500 hover:from-blue-700 hover:to-violet-600 text-white font-medium rounded-xl transition duration-300 ease-in-out transform hover:scale-105"
            >
              Continuar con el pago
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-primary-text text-center">Realizar pago</h3>
          <p className="text-gray-400 mb-6 text-center">
            Por favor, complete el pago para finalizar su registro
          </p>
          
          <div className="max-w-md mx-auto bg-gray-800/30 p-6 rounded-xl border border-gray-700">
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-1">Datos de contacto:</div>
              <p className="text-primary-text">{formData.nombre} {formData.apellido}</p>
              <p className="text-primary-text">{formData.email}</p>
              <p className="text-primary-text">{formData.telefono}</p>
              {formData.empresa && <p className="text-primary-text">Empresa: {formData.empresa}</p>}
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-1">Detalles del plan:</div>
              <p className="text-primary-text font-medium">{planInfo.plan}</p>
              <p className="text-primary-text">{planInfo.price} / {planInfo.period}</p>
            </div>
            
            <div className="mt-8">
              {/* 🔥 Aquí se pasan las props al WalletBrick */}
              <WalletBrick planInfo={planInfo} userData={formData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};