import React, { useState } from 'react';
import WalletBrick from './WalletBrick';

export const RegistroForm = ({ planInfo }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    empresa: '',
    aceptaTerminos: false
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const formErrors = {};
    let isValid = true;
    if (!formData.nombre.trim()) { formErrors.nombre = 'El nombre es obligatorio'; isValid = false; }
    if (!formData.apellido.trim()) { formErrors.apellido = 'El apellido es obligatorio'; isValid = false; }
    if (!formData.email.trim()) { formErrors.email = 'El email es obligatorio'; isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(formData.email)) { formErrors.email = 'Email inválido'; isValid = false; }
    if (!formData.telefono.trim()) { formErrors.telefono = 'El teléfono es obligatorio'; isValid = false; }
    if (!formData.aceptaTerminos) { formErrors.aceptaTerminos = 'Debes aceptar los términos'; isValid = false; }
    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) setFormSubmitted(true);
  };

  return (
    <div className="rounded-2xl p-6 md:p-8 w-full">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Form card */}
  <div className="lg:col-span-2 bg-card-bg border border-gray-700/20 rounded-3xl p-10 md:p-12 shadow-xl min-h-[520px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-semibold text-primary-text">Registro</h3>
              <p className="text-sm text-gray-400">Completa los datos para activar tu suscripción</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Plan</div>
              <div className="text-lg font-semibold text-primary-text">{planInfo.plan}</div>
              <div className="text-sm text-gray-400">{planInfo.price} / {planInfo.period}</div>
            </div>
          </div>

              {!formSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="nombre" className="block text-base md:text-lg font-medium text-primary-text mb-1">Nombre</label>
                  <input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className={`w-full px-6 py-4 rounded-2xl bg-transparent border ${errors.nombre ? 'border-red-500' : 'border-gray-700'} text-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-color/40`}
                  />
                  {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
                </div>

                <div>
                  <label htmlFor="apellido" className="block text-base md:text-lg font-medium text-primary-text mb-1">Apellido</label>
                  <input
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Tu apellido"
                    className={`w-full px-6 py-4 rounded-2xl bg-transparent border ${errors.apellido ? 'border-red-500' : 'border-gray-700'} text-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-color/40`}
                  />
                  {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-base md:text-lg font-medium text-primary-text mb-1">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className={`w-full px-6 py-4 rounded-2xl bg-transparent border ${errors.email ? 'border-red-500' : 'border-gray-700'} text-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-color/40`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-base md:text-lg font-medium text-primary-text mb-1">Teléfono</label>
                  <input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Tu teléfono"
                    className={`w-full px-6 py-4 rounded-2xl bg-transparent border ${errors.telefono ? 'border-red-500' : 'border-gray-700'} text-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-color/40`}
                  />
                  {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="empresa" className="block text-base md:text-lg font-medium text-primary-text mb-1">Empresa (opcional)</label>
                <input
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                  className="w-full px-6 py-4 rounded-2xl bg-transparent border border-gray-200/10 text-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-color/40"
                />
              </div>

              <div>
                <label htmlFor="aceptaTerminos" className="flex items-center gap-3 cursor-pointer select-none">
                  <input id="aceptaTerminos" name="aceptaTerminos" type="checkbox" checked={formData.aceptaTerminos} onChange={handleChange} className="sr-only peer" />
                  <span className="w-5 h-5 rounded-lg border border-gray-600 flex items-center justify-center bg-transparent transition-colors duration-150 peer-checked:bg-secondary-color peer-checked:border-transparent">
                    <svg className="hidden w-3 h-3 text-white peer-checked:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12l4 4L20 6" />
                    </svg>
                  </span>
                  <span className="text-base text-gray-300">Acepto los <span className="text-secondary-color underline cursor-pointer">términos y condiciones</span></span>
                </label>
              </div>
              {errors.aceptaTerminos && <p className="mt-1 text-xs text-red-500">{errors.aceptaTerminos}</p>}

              <div className="pt-3">
                <button type="submit" className="w-full inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-secondary-color to-primary-color text-white font-semibold shadow-xl hover:scale-[1.02] transition-transform">Continuar con el pago</button>
              </div>
            </form>
          ) : (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-primary-text mb-4 text-center">Resumen y pago</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact card */}
                <div className="p-6 rounded-2xl bg-card-bg border border-gray-700/20 shadow-sm">
                  <div className="text-sm text-gray-400 mb-3">Contacto</div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-400">Nombre</dt>
                      <dd className="text-primary-text font-medium">{formData.nombre} {formData.apellido}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400">Email</dt>
                      <dd className="text-primary-text">{formData.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400">Teléfono</dt>
                      <dd className="text-primary-text">{formData.telefono}</dd>
                    </div>
                    {formData.empresa && (
                      <div>
                        <dt className="text-xs text-gray-400">Empresa</dt>
                        <dd className="text-primary-text">{formData.empresa}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Plan & payment card */}
                <div className="p-6 rounded-2xl bg-card-bg border border-gray-700/20 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Plan seleccionado</div>
                    <div className="mt-2 text-2xl font-bold text-primary-text">{planInfo.plan}</div>
                    <div className="text-xl text-primary-text mt-1">{planInfo.price} <span className="text-sm text-gray-400">/ {planInfo.period}</span></div>

                    <ul className="mt-4 space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Soporte técnico</li>
                      <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Módulos esenciales</li>
                      <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Reportes y KPIs</li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <div className="w-full">
                      <WalletBrick planInfo={planInfo} userData={formData} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side summary */}
        <aside className="lg:col-span-1">
          <div className="bg-card-bg border border-gray-700/20 rounded-3xl p-8 md:p-10 shadow-lg sticky top-8 min-h-[360px]">
            <div className="mb-4">
              <div className="text-sm text-gray-400">Resumen del plan</div>
              <div className="text-2xl font-bold text-primary-text">{planInfo.plan}</div>
              <div className="text-gray-400">{planInfo.price} / {planInfo.period}</div>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Soporte técnico</li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Módulos esenciales</li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Reportes y KPIs</li>
            </ul>
            <div className="mt-6 text-xs text-gray-400">Una vez enviado el pago, revisaremos los datos y activaremos la cuenta en 24 horas.</div>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
};